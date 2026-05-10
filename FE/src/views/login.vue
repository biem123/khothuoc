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
    errorMessage.value = 'Vui lòng nhập đầy đủ thông tin';
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  try {
    await authStore.login(tendangnhap.value, matkhau.value);
    // Đăng nhập thành công -> Đẩy vào trang chủ
    router.push('/');
  } catch (error: any) {
    errorMessage.value = error.message || 'Đăng nhập thất bại';
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
        <p class="text-gray-500 mt-2">Hệ thống quản lý kho thuốc</p>
      </div>

      <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2">Tên đăng nhập</label>
          <input v-model="tendangnhap" type="text" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
        </div>
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2">Mật khẩu</label>
          <input v-model="matkhau" type="password" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400">
        </div>
        <button type="submit" :disabled="isLoading" class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded-lg">
          {{ isLoading ? 'Đang xử lý...' : 'Đăng nhập' }}
        </button>
      </form>
    </div>
  </div>
</template>