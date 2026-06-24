<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const tendangnhap = ref('');
const matkhau = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const handleLogin = async () => {
  if (!tendangnhap.value || !matkhau.value) {
    errorMessage.value = 'Vui lòng nhập đầy đủ tài khoản và mật khẩu';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    await authStore.login(tendangnhap.value, matkhau.value);
    
    // 🔥 ĐIỀU HƯỚNG CHỦ ĐỘNG TẠI ĐÂY (Bỏ qua vòng lặp chuyển hướng của Router)
    if (authStore.isAdmin) {
      router.push('/dashboard-admin');
    } else {
      router.push('/dashboard-nhanvien');
    }
  } catch (error: any) {
    // 🔥 VÁ LỖ HỔNG AXIOS: Bắt chính xác thông điệp tiếng Việt gửi về từ Express BE
    const backendMsg = error.response?.data?.message;
    errorMessage.value = backendMsg || error.message || 'Lỗi kết nối đến máy chủ!';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="bg-white p-8 rounded-xl shadow-lg w-96">
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-blue-600">PharmaManager</h1>
        <p class="text-gray-500 mt-2 font-medium text-sm">Hệ thống quản lý kho Dược phẩm</p>
      </div>

      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-xs font-bold text-center border border-red-200 shadow-sm animate-shake">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-gray-700 text-xs font-bold mb-1 uppercase">Tên đăng nhập</label>
          <input v-model="tendangnhap" type="text" placeholder="Nhập username..." class="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium bg-gray-50 focus:bg-white transition">
        </div>
        <div>
          <label class="block text-gray-700 text-xs font-bold mb-1 uppercase">Mật khẩu</label>
          <input v-model="matkhau" type="password" placeholder="••••••••" class="w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 font-medium bg-gray-50 focus:bg-white transition">
        </div>
        <button type="submit" :disabled="isLoading" class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2.5 px-4 rounded-lg transition shadow-md text-sm mt-2">
          {{ isLoading ? 'Đang xác thực thẻ...' : 'Đăng nhập hệ thống' }}
        </button>
      </form>
      
      <div class="mt-6 pt-4 border-t border-gray-100 text-[11px] text-gray-400 text-center">
        Tài khoản test: <span class="font-bold text-gray-600">admin_tong</span> | <span class="font-bold text-gray-600">thukho_01</span> | <span class="font-bold text-gray-600">sales_01</span> (Pass: 123456)
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

/* Tạo hiệu ứng rung nhẹ khi gõ sai pass cực xịn */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 0.2s ease-in-out 0s 2;
}
</style>