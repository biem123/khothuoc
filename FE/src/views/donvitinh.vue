<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const danhSachDonVi = ref([]);
const displayedDonVi = ref([]);
const danhSachThuoc = ref([]); // Đổ vào Dropdown lúc thêm/sửa
const isLoading = ref(false);

// --- MODAL STATE ---
const showModal = ref(false);
const isSaving = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const searchQuery = ref('');

// Cấu trúc form bám sát DB: tendonvi, hesoquydoi, mathuoc
const defaultForm = { mathuoc: '', tendonvi: '', hesoquydoi: 1 };
const formData = ref({ ...defaultForm });

// --- HÀM TÌM KIẾM ---
const applySearch = () => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    displayedDonVi.value = danhSachDonVi.value;
    return;
  }
  // Tìm theo Tên đơn vị hoặc Tên thuốc
  displayedDonVi.value = danhSachDonVi.value.filter((dv: any) =>
    (dv.tendonvi || '').toLowerCase().includes(query) ||
    (dv.tenthuoc || '').toLowerCase().includes(query)
  );
};

const onSearchInput = (event: Event) => {
  searchQuery.value = (event.target as HTMLInputElement).value;
  applySearch();
};

// --- TẢI DỮ LIỆU ---
const loadData = async () => {
  isLoading.value = true;
  try {
    const [resDV, resThuoc]: any = await Promise.all([
      api.get('/donvitinh'),
      api.get('/thuoc')
    ]);
    danhSachDonVi.value = resDV.data;
    danhSachThuoc.value = resThuoc.data;
    applySearch(); // Đổ dữ liệu vào mảng hiển thị
  } catch (error) { 
    console.error('Lỗi tải dữ liệu:', error); 
  } finally { 
    isLoading.value = false; 
  }
};

// --- XỬ LÝ MODAL ---
const openAddModal = () => {
  isEditMode.value = false;
  editingId.value = null;
  formData.value = { ...defaultForm };
  showModal.value = true;
};

const openEditModal = (dv: any) => {
  isEditMode.value = true;
  editingId.value = dv.madonvitinh;
  formData.value = { 
    mathuoc: dv.mathuoc, 
    tendonvi: dv.tendonvi, 
    hesoquydoi: dv.hesoquydoi 
  };
  showModal.value = true;
};

// --- LƯU (THÊM / SỬA) ---
const handleSave = async () => {
  if (!authStore.isAdmin) {
    alert('Bạn không có quyền chỉnh sửa đơn vị tính');
    return;
  }
  if (!formData.value.mathuoc || !formData.value.tendonvi || !formData.value.hesoquydoi) {
    alert('Vui lòng nhập đủ thông tin (*)'); return;
  }
  isSaving.value = true;
  try {
    if (isEditMode.value) {
      await api.put(`/donvitinh/${editingId.value}`, formData.value);
    } else {
      await api.post('/donvitinh', formData.value);
    }
    showModal.value = false;
    loadData();
  } catch (error: any) { 
    alert(error.message || 'Thao tác thất bại'); 
  } finally {
    isSaving.value = false;
  }
};

// --- XÓA ---
const handleDelete = async (id: number) => {
  if (!authStore.isAdmin) {
    alert('Bạn không có quyền xóa đơn vị tính');
    return;
  }
  if (confirm('Bạn có chắc chắn muốn xóa đơn vị quy đổi này?')) {
    try {
      await api.delete(`/donvitinh/${id}`);
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
      <h2 class="text-2xl font-bold text-gray-800">Cấu hình Đơn vị quy đổi</h2>
      
      <div class="flex gap-4 items-center">
        <div class="relative">
          <input 
            :value="searchQuery"
            @input="onSearchInput"
            type="text" 
            placeholder="Tìm đơn vị, thuốc..." 
            class="pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none w-64 text-sm"
          >
          <span class="absolute right-3 top-2.5 text-gray-400">🔍</span>
        </div>
        
        <button v-if="authStore.isAdmin" @click="openAddModal" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + Thêm đơn vị mới
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-gray-600 text-sm border-b">
            <th class="p-4 font-semibold">Mã ĐV</th>
            <th class="p-4 font-semibold">Tên Đơn vị</th>
            <th class="p-4 font-semibold">Hệ số quy đổi</th>
            <th class="p-4 font-semibold">Áp dụng cho Thuốc</th>
            <th class="p-4 font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dv in displayedDonVi" :key="dv.madonvitinh" class="border-b hover:bg-gray-50">
            <td class="p-4 text-gray-500 font-medium">#{{ dv.madonvitinh }}</td>
            <td class="p-4 text-blue-600 font-bold">{{ dv.tendonvi }}</td>
            <td class="p-4 text-gray-700 font-medium">x {{ dv.hesoquydoi }}</td>
            <td class="p-4 text-gray-800 font-medium">
              {{ dv.tenthuoc || `THUOC-${dv.mathuoc}` }}
            </td>
            <td class="p-4 flex gap-3">
              <button v-if="authStore.isAdmin" @click="openEditModal(dv)" class="text-blue-600 hover:underline font-medium text-sm">Sửa</button>
              <button v-if="authStore.isAdmin" @click="handleDelete(dv.madonvitinh)" class="text-red-600 hover:underline font-medium text-sm">Xóa</button>
            </td>
          </tr>
          <tr v-if="displayedDonVi.length === 0">
            <td colspan="5" class="p-8 text-center text-gray-500">
              {{ searchQuery ? 'Không tìm thấy kết quả phù hợp.' : 'Chưa có dữ liệu quy đổi.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl shadow-lg w-[450px]">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-800">{{ isEditMode ? 'Cập nhật Đơn vị' : 'Thêm Đơn vị quy đổi' }}</h3>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
        </div>
        
        <form @submit.prevent="handleSave" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Chọn thuốc áp dụng (*)</label>
            <select v-model="formData.mathuoc" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white" required :disabled="isEditMode">
              <option value="" disabled>-- Chọn thuốc --</option>
              <option v-for="t in danhSachThuoc" :key="t.mathuoc" :value="t.mathuoc">
                [#{{t.mathuoc}}] {{ t.tenthuoc }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tên đơn vị quy đổi (*)</label>
            <select v-model="formData.tendonvi" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white" required>
              <option value="" disabled>-- Chọn đơn vị quy đổi --</option>
              <option value="Hộp">Hộp</option>
              <option value="Thùng">Thùng</option>
              <option value="Vỉ">Vỉ</option>
              <option value="Kiện">Kiện</option>
              <option value="Lốc">Lốc</option>
              <option value="Bịch">Bịch</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Hệ số quy đổi (*)</label>
            <input v-model="formData.hesoquydoi" type="number" min="1" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" required>
            <p class="text-[11px] text-gray-500 mt-1">Ví dụ: Đơn vị cơ bản là Viên, 1 Thùng có 2400 viên thì nhập 2400.</p>
          </div>
          <div class="flex justify-end gap-3 mt-8 pt-4 border-t">
            <button type="button" @click="showModal = false" class="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Hủy</button>
            <button type="submit" :disabled="isSaving" class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
              {{ isSaving ? 'Đang lưu...' : (isEditMode ? 'Cập nhật' : 'Lưu lại') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>