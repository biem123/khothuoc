<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/services/api';

const authStore = useAuthStore();
const isLoading = ref(false);

// Nguồn dữ liệu
const tatCaDonHang = ref<any[]>([]);
const tatCaLoThuoc = ref<any[]>([]);
const tatCaThuoc = ref<any[]>([]);
const tatCaViTri = ref<any[]>([]); // Thêm biến lưu vị trí kho

// Biến cho tính năng tra cứu nhanh
const searchLookup = ref('');

const loadDashboardData = async () => {
  isLoading.value = true;
  try {
    // Thêm gọi API '/vitrikho' vào Promise.all
    const [resDH, resLo, resThuoc, resViTri]: any = await Promise.all([
      api.get('/donhang'),
      api.get('/lothuoc'),
      api.get('/thuoc'),
      api.get('/vitrikho') 
    ]);
    tatCaDonHang.value = resDH.data || [];
    tatCaLoThuoc.value = resLo.data || [];
    tatCaThuoc.value = resThuoc.data || [];
    tatCaViTri.value = resViTri.data || [];
  } catch (error) {
    console.error('Lỗi tải Dashboard nhân viên:', error);
  } finally {
    isLoading.value = false;
  }
};

// --- HÀM HELPER: LẤY TÊN VỊ TRÍ KHO ĐỂ HIỂN THỊ ---
const getTenViTri = (mavitri: any) => {
  if (!mavitri) return 'Chưa xếp kệ';
  const vt = tatCaViTri.value.find((v: any) => v.mavitri === mavitri);
  if (vt) return `${vt.makhuvuc} - ${vt.day} - ${vt.ke} - ${vt.tang}`;
  return 'Chưa xếp kệ';
};

// --- LOGIC LỌC DỮ LIỆU CÁ NHÂN ---

// 1. Lấy tất cả đơn hàng của RIÊNG nhân viên này
const donHangCuaToi = computed(() => {
  const myId = authStore.user?.mataikhoan;
  return tatCaDonHang.value.filter((dh: any) => dh.mataikhoan === myId);
});

// 2. Top 5 đơn hàng mới nhất của tôi
const top5DonHang = computed(() => {
  return [...donHangCuaToi.value]
    .sort((a, b) => new Date(b.ngaytao).getTime() - new Date(a.ngaytao).getTime())
    .slice(0, 5);
});

// 3. Tính doanh số cá nhân (Chỉ tính đơn XUẤT đã DỰYỆT trong tháng hiện tại)
const doanhSoThanhCong = computed(() => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return donHangCuaToi.value
    .filter((dh: any) => {
      const ngayTao = new Date(dh.ngaytao);
      return dh.loaidonhang === 'xuat' && 
             dh.trangthai === 'daduyet' && 
             ngayTao.getMonth() === currentMonth && 
             ngayTao.getFullYear() === currentYear;
    })
    .reduce((sum, dh) => sum + Number(dh.tonggiatri || 0), 0);
});

// 4. Đếm số đơn chờ duyệt
const soDonDangCho = computed(() => {
  return donHangCuaToi.value.filter((dh: any) => dh.trangthai === 'choduyet').length;
});

// 5. Cảnh báo đơn bị từ chối (Mới nhất)
const donBiTuChoi = computed(() => {
  return donHangCuaToi.value.filter((dh: any) => dh.trangthai === 'huy').slice(0, 3);
});

// --- LOGIC CẢNH BÁO KHO ---

const canhBaoSapHetHan = computed(() => {
  const today = new Date();
  const next30Days = new Date();
  next30Days.setDate(today.getDate() + 30);

  return tatCaLoThuoc.value.filter((lo: any) => {
    const hsd = new Date(lo.hansudung);
    return hsd > today && hsd <= next30Days && lo.tonkhadung > 0;
  });
});

const canhBaoSapHetHang = computed(() => {
  return tatCaLoThuoc.value.filter((lo: any) => lo.tonkhadung > 0 && lo.tonkhadung < 10);
});

// --- LOGIC TRA CỨU NHANH ---
const ketQuaTraCuu = computed(() => {
  const query = searchLookup.value.trim().toLowerCase();
  if (!query || query.length < 2) return [];
  
  return tatCaLoThuoc.value
    .filter((lo: any) => 
      lo.trangthai === 'sansangban' && // Chỉ lấy lô sẵn sàng bán
      (lo.tenthuoc.toLowerCase().includes(query) || lo.solo.toLowerCase().includes(query))
    )
    .slice(0, 5);
});

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

onMounted(() => loadDashboardData());
</script>

<template>
  <div class="space-y-6 pb-10">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Chào, <span class="text-blue-600">{{ authStore.user?.tendangnhap }}</span>!</h1>
        <p class="text-sm text-gray-500 mt-1">Hôm nay bạn có <span class="font-bold text-orange-600">{{ soDonDangCho }}</span> đơn hàng đang chờ Admin duyệt.</p>
      </div>
      <div class="text-right">
        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ngày hiện tại</p>
        <p class="font-bold text-gray-700">{{ new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }) }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white">
        <h3 class="text-blue-100 text-xs font-bold uppercase">Doanh số tháng này (Đã duyệt)</h3>
        <p class="text-3xl font-black mt-2">{{ formatCurrency(doanhSoThanhCong) }}</p>
        <div class="mt-4 flex items-center text-[11px] bg-white/10 w-fit px-2 py-1 rounded">
          ✨ Chỉ tính các đơn đã hoàn thành
        </div>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 class="text-gray-400 text-xs font-bold uppercase">Đơn hàng của tôi</h3>
        <div class="flex items-end justify-between mt-2">
          <p class="text-3xl font-black text-gray-800">{{ donHangCuaToi.length }} <span class="text-sm font-normal text-gray-400">tổng số</span></p>
          <div class="text-right">
            <p class="text-orange-500 font-bold text-sm">{{ soDonDangCho }} chờ duyệt</p>
            <p class="text-red-500 font-bold text-sm">{{ donHangCuaToi.filter(d => d.trangthai === 'huy').length }} bị từ chối</p>
          </div>
        </div>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
        <h3 class="text-gray-400 text-xs font-bold uppercase mb-3">Tra cứu nhanh tồn kho</h3>
        <div class="relative">
          <input v-model="searchLookup" type="text" placeholder="Gõ tên thuốc cần tìm..." class="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none">
          <span class="absolute right-3 top-2.5">🔍</span>
        </div>
        
        <div v-if="ketQuaTraCuu.length > 0" class="absolute left-0 right-0 top-full mt-2 bg-white shadow-2xl rounded-xl border z-50 overflow-hidden">
          <div v-for="item in ketQuaTraCuu" :key="item.malo" class="p-3 border-b hover:bg-blue-50 cursor-default transition">
            <div class="flex justify-between">
              <span class="font-bold text-gray-800 text-sm">{{ item.tenthuoc }}</span>
              <span class="text-blue-600 font-bold text-xs">SL: {{ item.tonkhadung }}</span>
            </div>
            <p class="text-[10px] text-gray-500 mt-1">
              Lô: <span class="font-medium text-gray-700 mr-2">{{ item.solo }}</span> | 
              Vị trí: <span class="font-semibold text-indigo-600">{{ getTenViTri(item.mavitri) }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-12 gap-6">
      <div class="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
          <h2 class="font-bold text-gray-800">📌 Giao dịch gần đây của bạn</h2>
          <button @click="loadDashboardData" class="text-xs text-blue-600 font-bold transition-all duration-200 hover:text-blue-700 hover:underline hover:scale-[1.03] active:scale-100">Làm mới 🔄</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="text-[10px] text-gray-400 uppercase bg-gray-50/50">
                <th class="px-6 py-3 font-bold">Mã Đơn</th>
                <th class="px-6 py-3 font-bold">Loại</th>
                <th class="px-6 py-3 font-bold">Đối Tác</th>
                <th class="px-6 py-3 font-bold text-right">Tổng Tiền</th>
                <th class="px-6 py-3 font-bold text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="dh in top5DonHang" :key="dh.madonhang" class="hover:bg-blue-50/30 transition">
                <td class="px-6 py-4 font-black text-gray-700">#{{ dh.madonhang }}</td>
                <td class="px-6 py-4">
                  <span :class="dh.loaidonhang === 'nhap' ? 'text-purple-600 bg-purple-50' : 'text-blue-600 bg-blue-50'" class="text-[10px] font-bold px-2 py-0.5 rounded border uppercase">
                    {{ dh.loaidonhang === 'nhap' ? 'Nhập' : 'Xuất' }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm font-medium text-gray-600">{{ dh.tendoitac }}</td>
                <td class="px-6 py-4 text-right font-bold text-gray-800">{{ formatCurrency(dh.tonggiatri) }}</td>
                <td class="px-6 py-4 text-center">
                  <span v-if="dh.trangthai === 'choduyet'" class="text-orange-600 text-[10px] font-bold">⏳ Chờ duyệt</span>
                  <span v-else-if="dh.trangthai === 'daduyet'" class="text-green-600 text-[10px] font-bold">✅ Thành công</span>
                  <span v-else class="text-red-500 text-[10px] font-bold">❌ Bị từ chối</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="top5DonHang.length === 0" class="p-10 text-center text-gray-400 text-sm">Bạn chưa có giao dịch nào.</div>
        </div>
      </div>

      <div class="col-span-12 lg:col-span-4 space-y-6">
        
        <div v-if="donBiTuChoi.length > 0" class="bg-red-50 p-5 rounded-2xl border border-red-100">
          <h3 class="text-red-700 font-bold text-sm mb-3 flex items-center gap-2">
            ⚠️ Đơn hàng bị từ chối
          </h3>
          <div class="space-y-3">
            <div v-for="dh in donBiTuChoi" :key="dh.madonhang" class="bg-white p-3 rounded-lg shadow-sm border-l-4 border-red-500">
              <div class="flex justify-between items-start">
                <span class="font-bold text-gray-800 text-xs">Đơn #{{ dh.madonhang }}</span>
                <span class="text-[9px] text-gray-400">{{ new Date(dh.ngaytao).toLocaleDateString() }}</span>
              </div>
              <p class="text-[11px] text-gray-500 mt-1">Đối tác: {{ dh.tendoitac }}</p>
              <p class="text-[10px] text-red-600 font-medium italic mt-1">Lý do: Vui lòng kiểm tra lại công nợ hoặc giá.</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 class="text-gray-800 font-bold text-sm mb-4">Cảnh báo kho hàng</h3>
          
          <div class="space-y-4">
            <div>
              <p class="text-[10px] font-bold text-orange-500 uppercase mb-2">💊 Lô thuốc cận date (30 ngày)</p>
              <div v-if="canhBaoSapHetHan.length > 0" class="space-y-2">
                <div v-for="lo in canhBaoSapHetHan" :key="lo.malo" class="flex justify-between items-center text-xs p-2 bg-orange-50 rounded">
                  <span class="font-medium text-gray-700">{{ lo.tenthuoc }}</span>
                  <span class="font-bold text-orange-600">{{ new Date(lo.hansudung).toLocaleDateString('vi-VN') }}</span>
                </div>
              </div>
              <p v-else class="text-[11px] text-gray-400 italic">Không có lô thuốc nào sắp hết hạn.</p>
            </div>

            <div>
              <p class="text-[10px] font-bold text-red-500 uppercase mb-2">📉 Thuốc sắp hết hàng (Tồn < 10)</p>
              <div v-if="canhBaoSapHetHang.length > 0" class="space-y-2">
                <div v-for="lo in canhBaoSapHetHang" :key="lo.malo" class="flex justify-between items-center text-xs p-2 bg-red-50 rounded">
                  <span class="font-medium text-gray-700">{{ lo.tenthuoc }} ({{ lo.solo }})</span>
                  <span class="font-black text-red-600">{{ lo.tonkhadung }}</span>
                </div>
              </div>
              <p v-else class="text-[11px] text-gray-400 italic">Tồn kho đang ở mức an toàn.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>