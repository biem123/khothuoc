import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/dashboard.vue'
import DashboardNhanVienView from '../views/dashboardNhanVien.vue'
import LoginView from '../views/login.vue'
import ThuocView from '../views/thuoc.vue' 
import LoThuocView from '../views/lothuoc.vue'
import TaiKhoanView from '../views/taikhoan.vue'
import DonViTinhView from '../views/donvitinh.vue'
import KiemKeView from '../views/kiemke.vue'
import DoiTacView from '../views/doitac.vue'
import PhieuNhapView from '../views/phieunhap.vue'
import PhieuXuatView from '../views/phieuxuat.vue'
import DuyetDonHangView from '../views/duyetdonhang.vue';
import LichSuDonHangView from '../views/lichsudonhang.vue';
import TraCuuDonHang from '../views/tracuudonhang.vue';
import BaoCaoThongKe from '../views/baocao.vue';
import { useAuthStore } from '@/stores/auth' 

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/tracuu',
      name: 'TraCuu',
      component: TraCuuDonHang,
    },
    { path: '/login', name: 'login', component: LoginView },
    {
      path: '/',
      component: () => import('../layouts/admin.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: 'dashboard-admin', name: 'dashboard-admin', component: DashboardView, meta: { roles: ['admin'] } },
        { path: 'dashboard-nhanvien', name: 'dashboard-nhanvien', component: DashboardNhanVienView, meta: { roles: ['kho', 'sales'] } },
        { path: '', redirect: () => {
            const authStore = useAuthStore();
            return authStore.isAdmin ? '/dashboard-admin' : '/dashboard-nhanvien';
        }},
        { path: 'thuoc', name: 'thuoc', component: ThuocView, meta: { roles: ['admin', 'kho', 'sales'] } },
        { path: 'lo-thuoc', name: 'lothuoc', component: LoThuocView, meta: { roles: ['admin', 'kho'] } },
        { path: 'don-vi-tinh', name: 'donvitinh', component: DonViTinhView, meta: { roles: ['admin', 'kho'] } },
        { path: 'kiem-ke', name: 'kiemke', component: KiemKeView, meta: { roles: ['admin', 'kho'] } },
        { path: 'tai-khoan', name: 'taikhoan', component: TaiKhoanView, meta: { roles: ['admin'] } }, 
        { path: 'doi-tac', name: 'doitac', component: DoiTacView, meta: { roles: ['admin', 'sales', 'kho'] } }, 
        { path: 'nhap-kho', name: 'nhapkho', component: PhieuNhapView, meta: { roles: ['admin', 'kho'] } },
        { path: 'xuat-kho', name: 'xuatkho', component: PhieuXuatView, meta: { roles: ['admin', 'sales'] } },
        { path: 'duyet-don', name: 'duyetdon', component: DuyetDonHangView, meta: { roles: ['admin'] } },
        { path: 'lich-su-don-hang', name: 'lichsudonhang', component: LichSuDonHangView, meta: { roles: ['admin', 'sales', 'kho'] } },
        { path: 'bao-cao', name: 'baocao', component: BaoCaoThongKe, meta: { roles: ['admin'] } },
      ]
    }
  ]
})

// BẢO VỆ ROUTE (Chặn người lạ)
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const userRole = authStore.user?.vaitro?.toLowerCase() || '';

  // Nếu trang yêu cầu đăng nhập MÀ chưa có token
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login'); // Đá về login
  } 
  // Nếu đã đăng nhập MÀ còn cố tình vào trang login
  else if (to.name === 'login' && isAuthenticated) {
    next('/'); // Đá vào trang chủ
  } 
  // Điều hướng dashboard theo role chuyên biệt
  else if (to.path === '/' && isAuthenticated) {
    if (userRole === 'admin') return next('/dashboard-admin');
    return next('/dashboard-nhanvien');
  }
  // Nếu route có giới hạn role
  else if (to.meta.roles && Array.isArray(to.meta.roles)) {
    const allowed = (to.meta.roles as string[]).map((r) => r.toLowerCase());
    if (!allowed.includes(userRole)) {
      // Nếu cố tình vào khu vực không được phép, trả về đúng Dashboard của họ
      return next(userRole === 'admin' ? '/dashboard-admin' : '/dashboard-nhanvien');
    }
    return next();
  }
  else {
    next();
  }
})

export default router;