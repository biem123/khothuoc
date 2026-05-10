import { defineStore } from 'pinia';
import api from '@/services/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Lấy thông tin cũ từ localStorage nếu có (giúp F5 không bị văng ra)
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.vaitro?.toLowerCase() === 'admin',
    isNhanVien: (state) => state.user?.vaitro?.toLowerCase() === 'nhanvien',
  },
  actions: {
    async login(tendangnhap: string, matkhau: string) {
      // Gọi API login (lưu ý API này không bị chặn token)
      const res: any = await api.post('/taikhoan/login', { tendangnhap, matkhau });
      
      // Cất vào két sắt State
      this.token = res.data.token;
      this.user = res.data.user;
      
      // Cất vào túi LocalStorage để giữ đăng nhập
      localStorage.setItem('token', this.token);
      localStorage.setItem('user', JSON.stringify(this.user));
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});