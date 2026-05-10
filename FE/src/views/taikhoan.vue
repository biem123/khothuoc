<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';

import { useAuthStore } from '@/stores/auth'; // Store chứa thông tin user đang đăng nhập
const authStore = useAuthStore();

const danhSachTK = ref([]);
const isLoading = ref(false);
const searchQuery = ref('');

// --- MODAL CẤP MỚI ---
const showModal = ref(false);
const isSaving = ref(false);
const formData = ref({ tendangnhap: '', matkhau: '', vaitro: 'NhanVien' });

// --- MODAL ĐỔI MẬT KHẨU ---
const showPasswordModal = ref(false);
const passwordData = ref({ mataikhoan: null, tendangnhap: '', matKhauCu: '', matKhauMoi: '' });

const loadData = async () => {
  isLoading.value = true;
  try {
    const res: any = await api.get('/taikhoan');
    danhSachTK.value = res.data;
  } catch (error) {
    console.error('Lỗi tải tài khoản:', error);
  } finally {
    isLoading.value = false;
  }
};

const displayedTK = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return danhSachTK.value;
  return danhSachTK.value.filter((tk: any) => tk.tendangnhap.toLowerCase().includes(query));
});

// Hàm tạo tài khoản (Khớp với POST /taikhoan)
const handleSave = async () => {
  if (!formData.value.tendangnhap || !formData.value.matkhau) {
    alert('Vui lòng nhập đủ thông tin!'); return;
  }
  isSaving.value = true;
  try {
    await api.post('/taikhoan', formData.value); 
    alert('Cấp tài khoản thành công!');
    showModal.value = false;
    formData.value = { tendangnhap: '', matkhau: '', vaitro: 'NhanVien' };
    loadData();
  } catch (error: any) { 
    alert(error.message || 'Lỗi hệ thống'); 
  } finally { 
    isSaving.value = false; 
  }
};

// Mở modal đổi pass
const openPasswordModal = (tk: any) => {
  passwordData.value = { mataikhoan: tk.mataikhoan, tendangnhap: tk.tendangnhap, matKhauCu: '', matKhauMoi: '' };
  showPasswordModal.value = true;
};

// Hàm đổi mật khẩu (Khớp với PUT /taikhoan/doimatkhau/:id)
const handleUpdatePassword = async () => {
  if (!passwordData.value.matKhauCu || !passwordData.value.matKhauMoi) {
    alert('Vui lòng nhập đủ mật khẩu cũ và mới!'); return;
  }
  try {
    await api.put(`/taikhoan/doimatkhau/${passwordData.value.mataikhoan}`, { 
      matKhauCu: passwordData.value.matKhauCu,
      matKhauMoi: passwordData.value.matKhauMoi
    });
    alert('Đã đổi mật khẩu thành công!');
    showPasswordModal.value = false;
  } catch (error: any) { 
    alert(error.message || 'Không thể đổi mật khẩu'); 
  }
};

// Hàm xóa tài khoản (Đã thêm 2 lớp chặn bảo mật)
const handleDelete = async (id: number) => {
  if (id === authStore.user?.mataikhoan) {
    alert('Cảnh báo: Bạn không thể tự xóa tài khoản mà mình đang đăng nhập!');
    return;
  }

  if (id === 0 || id === 1) {
    alert('Cảnh báo: Tài khoản Quản trị viên gốc được hệ thống bảo vệ, không thể xóa!');
    return;
  }

  if (confirm('Bạn có chắc chắn muốn xóa tài khoản này? Hành động này không thể hoàn tác!')) {
    try {
      await api.delete(`/taikhoan/${id}`);
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
      <h2 class="text-2xl font-bold text-gray-800">Quản lý Tài khoản</h2>
      <div class="flex gap-4 items-center">
        <div class="relative">
          <input v-model="searchQuery" type="text" placeholder="Tìm tên đăng nhập..." class="pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none w-56 text-sm">
          <span class="absolute right-3 top-2.5 text-gray-400">🔍</span>
        </div>
        <button @click="showModal = true" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
          + Cấp tài khoản mới
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-gray-600 text-sm border-b">
            <th class="p-4 font-semibold">Mã TK</th>
            <th class="p-4 font-semibold">Tên đăng nhập</th>
            <th class="p-4 font-semibold">Vai trò</th>
            <th class="p-4 font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tk in displayedTK" :key="tk.mataikhoan" class="border-b hover:bg-gray-50">
            <td class="p-4 text-gray-500 font-medium">#{{ tk.mataikhoan }}</td>
            <td class="p-4 text-gray-800 font-bold">{{ tk.tendangnhap }}</td>
            <td class="p-4">
              <span :class="tk.vaitro.toLowerCase() === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'" class="px-2 py-1 rounded-md text-xs font-bold border">
                {{ tk.vaitro }}
              </span>
            </td>
            <td class="p-4 flex gap-3">
              <button @click="openPasswordModal(tk)" class="text-blue-600 hover:underline font-medium text-sm">Đổi Pass</button>
              <button @click="handleDelete(tk.mataikhoan)" class="text-red-600 hover:underline font-medium text-sm">Xóa</button>
            </td>
          </tr>
          <tr v-if="displayedTK.length === 0">
            <td colspan="4" class="p-8 text-center text-gray-500">Không tìm thấy tài khoản.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl shadow-lg w-[400px]">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-800">Cấp tài khoản mới</h3>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
        </div>
        <form @submit.prevent="handleSave" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập (*)</label>
            <input v-model="formData.tendangnhap" type="text" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu (*)</label>
            <input v-model="formData.matkhau" type="password" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Vai trò hệ thống</label>
            <select v-model="formData.vaitro" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white">
              <option value="NhanVien">Nhân viên kho</option>
              <option value="Admin">Quản trị viên (Admin)</option>
            </select>
          </div>
          <div class="flex justify-end gap-3 mt-8 pt-4 border-t">
            <button type="button" @click="showModal = false" class="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Hủy</button>
            <button type="submit" :disabled="isSaving" class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400">
              {{ isSaving ? 'Đang tạo...' : 'Tạo tài khoản' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showPasswordModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl shadow-lg w-[400px]">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-800">Đổi Pass: <span class="text-blue-600">{{ passwordData.tendangnhap }}</span></h3>
          <button @click="showPasswordModal = false" class="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
        </div>
        <form @submit.prevent="handleUpdatePassword" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu cũ (*)</label>
            <input v-model="passwordData.matKhauCu" type="password" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" required>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới (*)</label>
            <input v-model="passwordData.matKhauMoi" type="password" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" required>
          </div>
          <div class="flex justify-end gap-3 mt-8 pt-4 border-t">
            <button type="button" @click="showPasswordModal = false" class="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Hủy</button>
            <button type="submit" class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Cập nhật</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>