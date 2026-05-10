<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';

const danhSachLo = ref<any[]>([]);
const danhSachThuoc = ref<any[]>([]);
const danhSachViTri = ref<any[]>([]);
const displayedLo = ref<any[]>([]);
const isLoading = ref(false);

const showModal = ref(false);
const isSaving = ref(false);
const editingId = ref<number | null>(null);
const searchQuery = ref('');

const defaultForm = {
  solo: '',
  mathuoc: '',
  tonthucte: 0,
  tonkhadung: 0,
  ngaysanxuat: '',
  hansudung: '',
  ngaynhap: '',
  mavitri: '',
  trangthai: 'sansangban'
};

const formData = ref({ ...defaultForm });

const loadData = async () => {
  isLoading.value = true;
  try {
    const [resLo, resThuoc, resViTri]: any = await Promise.all([
      api.get('/lothuoc'),
      api.get('/thuoc'),
      api.get('/vitrikho')
    ]);
    danhSachLo.value = resLo.data;
    danhSachThuoc.value = resThuoc.data;
    danhSachViTri.value = resViTri.data;
    displayedLo.value = danhSachLo.value;
  } catch (error) {
    console.error('Lỗi tải dữ liệu lô:', error);
  } finally {
    isLoading.value = false;
  }
};

const applySearch = () => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    displayedLo.value = danhSachLo.value;
    return;
  }
  displayedLo.value = danhSachLo.value.filter((lo: any) =>
    (lo.solo || '').toLowerCase().includes(query) ||
    (lo.tenthuoc || '').toLowerCase().includes(query)
  );
};

// HÀM HELPER: LẤY TÊN VỊ TRÍ KHO ĐỂ HIỂN THỊ
const getTenViTri = (mavitri: any) => {
  if (!mavitri) return null;
  const vt = danhSachViTri.value.find((v: any) => v.mavitri === mavitri);
  if (vt) return `[${vt.makhuvuc}] ${vt.day} - ${vt.ke}`;
  return null;
};

const openEditModal = (lo: any) => {
  editingId.value = lo.malo;
  formData.value = { 
    ...lo,
    ngaysanxuat: lo.ngaysanxuat ? new Date(lo.ngaysanxuat).toISOString().split('T')[0] : '',
    hansudung: lo.hansudung ? new Date(lo.hansudung).toISOString().split('T')[0] : ''
  };
  showModal.value = true;
};

const handleSave = async () => {
  isSaving.value = true;
  try {
    if (editingId.value) {
      await api.put(`/lothuoc/${editingId.value}`, formData.value);
      alert('Cập nhật thông tin lô thành công!');
    }
    showModal.value = false;
    loadData();
  } catch (error: any) {
    alert(error.response?.data?.message || error.message || 'Lỗi khi lưu dữ liệu');
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => loadData());
</script>

<template>
  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-screen">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">📦 Quản lý Lô thuốc & Tồn kho</h2>
      <div class="flex gap-4">
        <div class="relative">
          <input v-model="searchQuery" @input="applySearch" type="text" placeholder="Tìm số lô, tên thuốc..." class="pl-4 pr-10 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none w-64">
          <span class="absolute right-3 top-2 text-gray-400 font-bold">🔍</span>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-gray-500 text-xs uppercase border-b">
            <th class="p-4 font-bold">Số Lô</th>
            <th class="p-4 font-bold">Thuốc</th>
            <th class="p-4 font-bold text-center">Tồn Khả dụng / Thực tế</th>
            <th class="p-4 font-bold">Hạn sử dụng</th>
            <th class="p-4 font-bold">Vị trí kho</th>
            <th class="p-4 font-bold">Trạng Thái</th>
            <th class="p-4 font-bold text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="lo in displayedLo" :key="lo.malo" class="border-b hover:bg-gray-50 transition">
            <td class="p-4 font-black text-gray-800">{{ lo.solo }}</td>
            <td class="p-4 font-medium text-blue-700">{{ lo.tenthuoc }}</td>
            <td class="p-4 text-center">
              <span class="font-bold text-blue-600">{{ lo.tonkhadung }}</span> 
              <span class="text-gray-400 mx-1">/</span> 
              <span class="font-medium text-gray-600">{{ lo.tonthucte }}</span>
            </td>
            <td class="p-4">
              <span :class="new Date(lo.hansudung) < new Date() ? 'text-red-600 font-bold' : 'text-gray-600'">
                {{ new Date(lo.hansudung).toLocaleDateString('vi-VN') }}
              </span>
            </td>
            <td class="p-4">
               <span v-if="getTenViTri(lo.mavitri)" class="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 whitespace-nowrap">
                 📍 {{ getTenViTri(lo.mavitri) }}
               </span>
               <span v-else class="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200 whitespace-nowrap">
                 ⏳ Chờ sắp xếp
               </span>
            </td>
            <td class="p-4">
              <span v-if="lo.trangthai === 'sansangban'" class="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Sẵn sàng bán</span>
              <span v-else-if="lo.trangthai === 'biettru'" class="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded uppercase">Biệt trữ</span>
              <span v-else class="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">Khóa Lô</span>
            </td>
            <td class="p-4 text-center">
              <button @click="openEditModal(lo)" class="text-blue-600 font-bold hover:underline text-sm">Cất hàng</button>
            </td>
          </tr>
          <tr v-if="displayedLo.length === 0">
            <td colspan="7" class="p-10 text-center text-gray-500">Không tìm thấy lô thuốc nào.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl shadow-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-6 text-gray-800">Cập nhật Lô thuốc & Sắp xếp kho</h3>
        <form @submit.prevent="handleSave">
          <div class="grid grid-cols-2 gap-4">
            
            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">Số lô (*)</label>
              <input v-model="formData.solo" type="text" disabled class="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">Thuốc (*)</label>
              <select v-model="formData.mathuoc" disabled class="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed">
                <option v-for="t in danhSachThuoc" :key="t.mathuoc" :value="t.mathuoc">{{ t.tenthuoc }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">Ngày sản xuất (*)</label>
              <input v-model="formData.ngaysanxuat" type="date" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">Hạn sử dụng (*)</label>
              <input v-model="formData.hansudung" type="date" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">Tồn thực tế</label>
              <input v-model.number="formData.tonthucte" type="number" class="w-full px-3 py-2 border rounded-lg font-bold bg-gray-50 outline-none">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-500 mb-1">Tồn khả dụng</label>
              <input v-model.number="formData.tonkhadung" type="number" class="w-full px-3 py-2 border rounded-lg font-bold bg-gray-50 outline-none">
            </div>

            <div class="col-span-2 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
              <label class="block text-sm font-bold text-indigo-700 mb-2">📍 Xếp hàng lên kệ (Vị trí kho)</label>
              <select v-model="formData.mavitri" class="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none bg-white font-medium text-indigo-900">
                <option value="" disabled>-- Chưa sắp xếp vị trí --</option>
                <option v-for="vt in danhSachViTri" :key="vt.mavitri" :value="vt.mavitri">
                  Khu vực: {{ vt.makhuvuc }} | Dãy: {{ vt.day }} | Kệ: {{ vt.ke }} | Tầng: {{ vt.tang }}
                </option>
              </select>
            </div>

            <div class="col-span-2">
              <label class="block text-sm font-bold text-gray-700 mb-1">Trạng thái lô</label>
              <select v-model="formData.trangthai" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white font-bold">
                <option value="sansangban" class="text-green-600">Sẵn sàng bán (Đã lên kệ)</option>
                <option value="biettru" class="text-yellow-600">Biệt trữ (Chờ kiểm/Chờ xếp)</option>
                <option value="khoalo" class="text-red-600">Khóa lô (Lỗi/Hết hạn)</option>
              </select>
            </div>

          </div>

          <div class="flex justify-end gap-3 mt-8 pt-4 border-t">
            <button type="button" @click="showModal = false" class="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Hủy</button>
            <button type="submit" :disabled="isSaving" class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>