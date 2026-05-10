<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth'; // Import store để check quyền

const authStore = useAuthStore();
const danhSachDoiTac = ref([]);
const isLoading = ref(false);
const searchQuery = ref('');
const activeTab = ref('TatCa'); // TatCa | NhaCungCap | KhachHang

// --- MODAL STATE ---
const showModal = ref(false);
const isSaving = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);

const defaultForm = {
  tendoitac: '',
  masothue: '',
  loaidoitac: 'NhaCungCap',
  diachi: '',
  sodienthoai: '',
  email: '',
  trangthai: 'Dang hop tac',
  tongnohientai: 0 // Thêm trường công nợ để cập nhật
};
const formData = ref({ ...defaultForm });

// --- TẢI DỮ LIỆU ---
const loadData = async () => {
  isLoading.value = true;
  try {
    const res: any = await api.get('/doitac');
    danhSachDoiTac.value = res.data;
  } catch (error) {
    console.error('Lỗi tải dữ liệu đối tác:', error);
  } finally {
    isLoading.value = false;
  }
};

// --- LỌC DỮ LIỆU TỔNG HỢP (Theo Tab + Text) ---
const displayedDoiTac = computed(() => {
  let filtered = danhSachDoiTac.value;

  // 1. Lọc theo Tab
  if (activeTab.value !== 'TatCa') {
    filtered = filtered.filter((dt: any) => dt.loaidoitac === activeTab.value);
  }

  // 2. Lọc theo ô tìm kiếm
  const query = searchQuery.value.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter((dt: any) => 
      (dt.tendoitac || '').toLowerCase().includes(query) ||
      (dt.sodienthoai || '').includes(query) ||
      (dt.email || '').toLowerCase().includes(query)
    );
  }

  return filtered;
});

// --- HELPER: Format Tiền ---
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
};

// --- XỬ LÝ MODAL ---
const openAddModal = () => {
  isEditMode.value = false;
  editingId.value = null;
  formData.value = { ...defaultForm, loaidoitac: activeTab.value === 'KhachHang' ? 'KhachHang' : 'NhaCungCap' };
  showModal.value = true;
};

const openEditModal = (dt: any) => {
  isEditMode.value = true;
  editingId.value = dt.madoitac;
  formData.value = { ...dt }; // Load toàn bộ thông tin cũ (Bao gồm cả tongnohientai) lên Form
  showModal.value = true;
};

const normalizePhone = (val: string) => (val || '').replace(/\D/g, '');
const isValidPhone = (val: string) => /^(\d{8}|\d{10})$/.test(val);
const isValidEmail = (val: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val || '');

// --- LƯU & XÓA ---
const handleSave = async () => {
  if (!authStore.isAdmin) {
    alert('Bạn không có quyền chỉnh sửa đối tác');
    return;
  }
  if (!formData.value.tendoitac || !formData.value.loaidoitac) {
    alert('Vui lòng nhập Tên đối tác và Loại đối tác!');
    return;
  }

  const phone = normalizePhone(formData.value.sodienthoai);
  const email = (formData.value.email || '').trim();
  const diachi = (formData.value.diachi || '').trim();

  if (!phone || !email) {
    alert('Số điện thoại và email không được để trống!');
    return;
  }

  if (!diachi) {
    alert('Địa chỉ không được để trống!');
    return;
  }

  if (!isValidPhone(phone)) {
    alert('Số điện thoại phải có 8 hoặc 10 chữ số!');
    return;
  }

  if (!isValidEmail(email)) {
    alert('Email phải có tên miền sau @');
    return;
  }

  // KIỂM TRA ĐỊNH DẠNG MÃ SỐ THUẾ (10 HOẶC 13 SỐ LIÊN TIẾP)
  const mst = (formData.value.masothue || '').trim();
  if (mst && !/^(\d{10}|\d{13})$/.test(mst)) {
    alert('LỖI: Mã số thuế phải bao gồm ĐÚNG 10 hoặc 13 CHỮ SỐ liên tiếp!');
    return;
  }
  formData.value.masothue = mst;

  formData.value.sodienthoai = phone;
  formData.value.email = email;
  isSaving.value = true;
  try {
    if (isEditMode.value) {
      await api.put(`/doitac/${editingId.value}`, formData.value);
    } else {
      await api.post('/doitac', formData.value);
    }
    showModal.value = false;
    loadData();
  } catch (error: any) {
    alert(error.message || 'Thao tác thất bại');
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = async (id: number) => {
  if (!authStore.isAdmin) {
    alert('Bạn không có quyền xóa đối tác');
    return;
  }
  if (confirm('Bạn có chắc muốn xóa đối tác này? Toàn bộ đơn hàng liên quan có thể bị ảnh hưởng!')) {
    try {
      await api.delete(`/doitac/${id}`);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Xóa thất bại');
    }
  }
};

onMounted(() => loadData());
</script>

<template>
  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Quản lý Đối tác</h2>
      
      <div class="flex gap-4 items-center">
        <div class="relative">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Tìm tên, SĐT, email..." 
            class="pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none w-64 text-sm"
          >
          <span class="absolute right-3 top-2.5 text-gray-400">🔍</span>
        </div>
        <button v-if="authStore.isAdmin" @click="openAddModal" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + Thêm đối tác
        </button>
      </div>
    </div>

    <div class="flex border-b mb-4">
      <button 
        @click="activeTab = 'TatCa'" 
        :class="activeTab === 'TatCa' ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'"
        class="px-6 py-3 border-b-2 font-medium text-sm transition"
      >Tất cả</button>
      <button 
        @click="activeTab = 'NhaCungCap'" 
        :class="activeTab === 'NhaCungCap' ? 'border-purple-600 text-purple-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'"
        class="px-6 py-3 border-b-2 font-medium text-sm transition flex items-center gap-2"
      >📦 Nhà Cung Cấp</button>
      <button 
        @click="activeTab = 'KhachHang'" 
        :class="activeTab === 'KhachHang' ? 'border-green-600 text-green-600 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700'"
        class="px-6 py-3 border-b-2 font-medium text-sm transition flex items-center gap-2"
      >🤝 Khách Hàng</button>
    </div>

    <div v-if="isLoading" class="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-gray-600 text-sm border-b">
            <th class="p-4 font-semibold w-16">Mã</th>
            <th class="p-4 font-semibold">Tên Đối tác</th>
            <th class="p-4 font-semibold">Liên hệ</th>
            <th class="p-4 font-semibold">Công nợ / Giao dịch</th>
            <th class="p-4 font-semibold">Trạng thái</th>
            <th class="p-4 font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dt in displayedDoiTac" :key="dt.madoitac" class="border-b hover:bg-gray-50">
            <td class="p-4 text-gray-500 font-medium">#{{ dt.madoitac }}</td>
            <td class="p-4">
              <div class="font-bold text-gray-800">{{ dt.tendoitac }}</div>
              <div class="text-xs text-gray-500 mt-1">MST: {{ dt.masothue || '---' }}</div>
              <div class="mt-1">
                 <span v-if="dt.loaidoitac === 'NhaCungCap'" class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px] font-bold">Nhà Cung Cấp</span>
                 <span v-else class="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold">Khách Hàng</span>
              </div>
            </td>
            <td class="p-4 text-sm text-gray-600">
              <div class="flex items-center gap-1"><span class="w-4">📞</span> {{ dt.sodienthoai || '---' }}</div>
              <div class="flex items-center gap-1 mt-1"><span class="w-4">✉️</span> {{ dt.email || '---' }}</div>
            </td>
            <td class="p-4 text-sm">
              <div v-if="dt.loaidoitac === 'KhachHang'" class="font-medium" :class="dt.tongnohientai > 0 ? 'text-red-600' : 'text-gray-500'">
                Nợ: {{ formatCurrency(dt.tongnohientai) }}
              </div>
              <div class="text-xs text-gray-500" :class="{'mt-1': dt.loaidoitac === 'KhachHang'}">
                {{ dt.solangiaodich_thanhcong || 0 }} GD thành công
              </div>
            </td>
            <td class="p-4">
              <span :class="dt.trangthai === 'Dang hop tac' ? 'text-green-600' : 'text-red-500'" class="font-medium text-sm flex items-center gap-1">
                <span class="w-2 h-2 rounded-full" :class="dt.trangthai === 'Dang hop tac' ? 'bg-green-500' : 'bg-red-500'"></span>
                {{ dt.trangthai === 'Dang hop tac' ? 'Hợp tác' : 'Ngừng' }}
              </span>
            </td>
            <td class="p-4">
              <div class="flex gap-3">
                <button v-if="authStore.isAdmin" @click="openEditModal(dt)" class="text-blue-600 hover:underline font-medium text-sm">Sửa</button>
                <button v-if="authStore.isAdmin" @click="handleDelete(dt.madoitac)" class="text-red-600 hover:underline font-medium text-sm">Xóa</button>
              </div>
            </td>
          </tr>
          <tr v-if="displayedDoiTac.length === 0">
            <td colspan="6" class="p-8 text-center text-gray-500">Chưa có dữ liệu đối tác.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl shadow-lg w-[700px] max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-800">{{ isEditMode ? 'Cập nhật Đối tác' : 'Thêm Đối tác mới' }}</h3>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
        </div>
        
        <form @submit.prevent="handleSave" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tên đối tác (*)</label>
              <input v-model="formData.tendoitac" type="text" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Loại đối tác (*)</label>
              <select v-model="formData.loaidoitac" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white">
                <option value="NhaCungCap">Nhà Cung Cấp</option>
                <option value="KhachHang">Khách Hàng</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input v-model="formData.sodienthoai" type="text" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input v-model="formData.email" type="text" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mã số thuế</label>
              <input v-model="formData.masothue" type="text" maxlength="13" placeholder="Nhập 10 hoặc 13 số..." class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Trạng thái hợp tác</label>
              <select v-model="formData.trangthai" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white">
                <option value="Dang hop tac">Đang hợp tác</option>
                <option value="Ngung hop tac">Ngừng hợp tác</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div :class="formData.loaidoitac === 'KhachHang' ? 'col-span-1' : 'col-span-2'">
              <label class="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <input v-model="formData.diachi" type="text" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required>
            </div>

            <div v-if="formData.loaidoitac === 'KhachHang'">
              <label class="block text-sm font-bold text-red-600 mb-1">Công nợ khách hàng (VND)</label>
              <input v-model.number="formData.tongnohientai" type="number" min="0" placeholder="Nhập để cấn trừ nợ..." class="w-full px-3 py-2 border-2 border-red-300 bg-red-50 text-red-700 font-bold rounded-lg focus:ring-2 focus:ring-red-400 outline-none transition">
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-8 pt-4 border-t">
            <button type="button" @click="showModal = false" class="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Hủy</button>
            <button type="submit" :disabled="isSaving" class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
              {{ isSaving ? 'Đang lưu...' : (isEditMode ? 'Cập nhật' : 'Lưu thông tin') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>