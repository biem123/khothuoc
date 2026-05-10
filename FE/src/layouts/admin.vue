<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// Hàm xử lý khi bấm nút Đăng xuất
const handleLogout = () => {
  authStore.logout(); 
  router.push('/login'); 
}
</script>

<template>
  <div class="flex h-screen bg-gray-100">
    <aside class="w-64 bg-slate-800 text-white flex flex-col">
      <div class="h-16 flex items-center justify-center border-b border-slate-700">
        <h1 class="text-2xl font-bold text-blue-400">Pharma<span class="text-white">Manager</span></h1>
      </div>
      
      <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
        <RouterLink :to="authStore.isAdmin ? '/dashboard-admin' : '/dashboard-nhanvien'" class="menu-item">📊 Tổng quan</RouterLink>
        <RouterLink to="/thuoc" class="menu-item">💊 Danh mục Thuốc</RouterLink>
        <RouterLink to="/don-vi-tinh" class="menu-item">⚖️ Đơn vị tính</RouterLink>
        <RouterLink to="/lo-thuoc" class="menu-item">📦 Quản lý Lô</RouterLink>
        <RouterLink to="/doi-tac" class="menu-item">🤝 Đối tác</RouterLink>
        
        <RouterLink v-if="!authStore.isAdmin" to="/nhap-kho" class="menu-item">📦 Nhập kho</RouterLink>
        <RouterLink v-if="!authStore.isAdmin" to="/xuat-kho" class="menu-item">🚚 Xuất kho</RouterLink>

        <RouterLink v-if="authStore.isAdmin" to="/duyet-don" class="menu-item">
          ✅ Duyệt đơn hàng
        </RouterLink>

        <RouterLink to="/kiem-ke" class="menu-item">📋 Kiểm kê</RouterLink>
        <RouterLink v-if="authStore.isAdmin" to="/lich-su-don-hang" class="menu-item">
          📜 Lịch sử giao dịch
        </RouterLink>
        <RouterLink v-if="authStore.isAdmin" to="/tai-khoan" class="menu-item">👥 Tài khoản</RouterLink>
        <RouterLink v-if="authStore.isAdmin" to="/bao-cao" class="menu-item">
          📈 Báo cáo Doanh thu
        </RouterLink>
      </nav>
    </aside>

    <div class="flex-1 flex flex-col overflow-hidden">
      <header class="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
        <h2 class="text-xl font-semibold text-gray-800">Hệ thống Quản lý Kho</h2>
        
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold uppercase">
              {{ authStore.user?.tendangnhap?.charAt(0) || 'U' }}
            </div>
            <div class="flex flex-col">
              <span class="text-sm font-bold text-gray-700 leading-tight">
                {{ authStore.user?.tendangnhap || 'Người dùng' }}
              </span>
              <span class="text-[10px] text-gray-500 uppercase font-bold">
                {{ authStore.isAdmin ? 'Quản trị viên' : 'Nhân viên' }}
              </span>
            </div>
          </div>
          
          <button @click="handleLogout" class="px-4 py-1.5 text-sm bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition">
            Đăng xuất
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-x-hidden overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.menu-item {
  @apply block px-4 py-2.5 rounded-lg transition-colors duration-200 text-slate-300 hover:bg-slate-700 hover:text-white text-sm font-medium;
}
.router-link-active {
  @apply bg-blue-600 text-white font-bold hover:bg-blue-600 shadow-md;
}
</style>