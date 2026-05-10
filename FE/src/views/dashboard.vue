<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';

const authStore = useAuthStore();
const danhSachDonMoiNhat = ref<any[]>([]);
const isLoading = ref(false);

// Các biến lưu trữ dữ liệu thật
const tongThuocTrongKho = ref(0);
const tongDoanhThu = ref(0);
const soDonChoDuyet = ref(0);

const loadDashboardData = async () => {
  isLoading.value = true;
  try {
    // Kéo dữ liệu từ 3 bảng quan trọng nhất để tính toán
    const [resDH, resPKK, resLoThuoc]: any = await Promise.all([
      api.get('/donhang'),
      api.get('/phieukiemke'),
      api.get('/lothuoc')
    ]);

    const donHangData = resDH.data || [];
    const pkkData = resPKK.data || [];
    const loThuocData = resLoThuoc.data || [];

    // 1. Tính TỔNG THUỐC TRONG KHO (Cộng dồn tất cả tồn thực tế trên kệ)
    tongThuocTrongKho.value = loThuocData.reduce((sum: number, lo: any) => sum + Number(lo.tonthucte || 0), 0);

    // 2. Tính TỔNG DOANH THU (Chỉ cộng tiền của các Đơn Xuất đã được Duyệt)
    tongDoanhThu.value = donHangData
      .filter((dh: any) => dh.loaidonhang === 'xuat' && dh.trangthai === 'daduyet')
      .reduce((sum: number, dh: any) => sum + Number(dh.tonggiatri || 0), 0);

    // 3. Tính SỐ ĐƠN CHỜ DUYỆT (Bao gồm Đơn Nhập/Xuất chờ duyệt + Phiếu Kiểm Kê chờ duyệt)
    const soDHChoDuyet = donHangData.filter((dh: any) => dh.trangthai === 'choduyet').length;
    const soKiemKeChoDuyet = pkkData.filter((p: any) => p.trangthai === 'dangkhiemke' || p.trangthai === 'Draft').length;
    soDonChoDuyet.value = soDHChoDuyet + soKiemKeChoDuyet;

    // 4. Lấy 5 giao dịch mới nhất cho Bảng Lịch sử (bao gồm cả nhập và xuất)
    danhSachDonMoiNhat.value = [...donHangData]
      .sort((a: any, b: any) => new Date(b.ngaytao).getTime() - new Date(a.ngaytao).getTime())
      .slice(0, 5);

  } catch (error) {
    console.error('Lỗi tải Dashboard:', error);
  } finally {
    isLoading.value = false;
  }
};

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

onMounted(() => loadDashboardData());
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">
        Chào mừng trở lại, <span class="text-blue-600">{{ authStore.user?.tendangnhap }}</span>!
      </h1>
      <span class="px-3 py-1 bg-blue-100 text-blue-700 font-bold rounded-full text-sm">Admin Dashboard</span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <div class="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-blue-500 hover:shadow-md transition">
        <h3 class="text-gray-500 text-sm font-medium uppercase tracking-wide">Tổng Tồn Kho (Thực tế)</h3>
        <p class="text-3xl font-black text-gray-800 mt-2">{{ tongThuocTrongKho.toLocaleString('vi-VN') }} <span class="text-sm font-medium text-gray-400">đơn vị</span></p>
      </div>
      
      <div class="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-orange-500 hover:shadow-md transition relative overflow-hidden">
        <h3 class="text-gray-500 text-sm font-medium uppercase tracking-wide">Yêu Cầu Chờ Phê Duyệt</h3>
        <p class="text-3xl font-black text-orange-600 mt-2">{{ soDonChoDuyet }}</p>
        <RouterLink v-if="soDonChoDuyet > 0" to="/duyet-don" class="absolute top-6 right-6 text-sm font-bold text-orange-500 hover:underline">
          Xử lý ngay →
        </RouterLink>
      </div>

      <div class="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-green-500 hover:shadow-md transition">
        <h3 class="text-gray-500 text-sm font-medium uppercase tracking-wide">Tổng Doanh Thu Ghi Nhận</h3>
        <p class="text-3xl font-black text-green-600 mt-2">{{ formatCurrency(tongDoanhThu) }}</p>
      </div>

    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h2 class="text-lg font-bold text-gray-800">📌 5 Giao dịch gần nhất</h2>
        <RouterLink to="/lich-su-don-hang" class="text-sm text-blue-600 font-bold hover:underline">Xem toàn bộ lịch sử</RouterLink>
      </div>

      <div v-if="isLoading" class="p-10 text-center text-gray-500">Đang đồng bộ dữ liệu hệ thống...</div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[12px] text-gray-500 uppercase border-b bg-white">
              <th class="px-6 py-3 font-bold">Mã Đơn</th>
              <th class="px-6 py-3 font-bold">Phân Loại</th>
              <th class="px-6 py-3 font-bold">Đối Tác</th>
              <th class="px-6 py-3 font-bold text-right">Tổng Tiền</th>
              <th class="px-6 py-3 font-bold text-center">Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dh in danhSachDonMoiNhat" :key="dh.madonhang" class="border-b border-dashed hover:bg-gray-50">
              <td class="px-6 py-4 font-black text-gray-800">#{{ dh.madonhang }}</td>
              <td class="px-6 py-4">
                <span :class="(String(dh.loaidonhang || '').trim().toLowerCase() === 'nhap') ? 'text-purple-600 bg-purple-50 border-purple-200' : 'text-blue-600 bg-blue-50 border-blue-200'" class="font-bold text-[10px] uppercase px-2 py-1 rounded border inline-block">
                  {{ String(dh.loaidonhang || '').trim().toLowerCase() === 'nhap' ? '📦 Nhập Kho' : '🚚 Xuất Kho' }}
                </span>
              </td>
              <td class="px-6 py-4 font-medium text-gray-700">{{ dh.tendoitac }}</td>
              <td class="px-6 py-4 text-right font-black text-red-600">{{ formatCurrency(dh.tonggiatri) }}</td>
              <td class="px-6 py-4 text-center">
                <span v-if="dh.trangthai === 'choduyet'" class="px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded uppercase">Chờ duyệt</span>
                <span v-else-if="dh.trangthai === 'daduyet'" class="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Hoàn thành</span>
                <span v-else class="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-bold rounded uppercase">Đã hủy</span>
              </td>
            </tr>
            <tr v-if="danhSachDonMoiNhat.length === 0">
              <td colspan="5" class="p-8 text-center text-gray-400 italic">Chưa có giao dịch nào được ghi nhận.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>