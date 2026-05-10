<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';

// Đảm bảo đúng cổng backend của bạn là 5000
const API_URL = 'http://localhost:5000/api'; 

const sodienthoai = ref('');
const mavandon3pl = ref(''); // Đồng bộ chuẩn tên biến với Backend
const isLoading = ref(false);
const errorMsg = ref('');
const orderData = ref<any>(null);

const handleSearch = async () => {
  // Logic: Chỉ báo lỗi khi CẢ 2 ô đều bị bỏ trống
  if (!sodienthoai.value && !mavandon3pl.value) {
    errorMsg.value = 'Vui lòng nhập Số điện thoại hoặc Mã vận đơn!';
    return;
  }
  
  isLoading.value = true;
  errorMsg.value = '';
  orderData.value = null;

  try {
    const response = await axios.post(`${API_URL}/donhang/tracuu-congkhai`, {
      // Truyền đúng tên biến xuống Backend. Nếu rỗng thì truyền null để tránh lỗi thư viện MySQL
      sodienthoai: sodienthoai.value.trim() || null,
      mavandon3pl: mavandon3pl.value.trim() || null
    });
    
    orderData.value = response.data.data;
  } catch (error: any) {
    errorMsg.value = error.response?.data?.message || 'Không tìm thấy đơn hàng. Vui lòng kiểm tra lại thông tin!';
  } finally {
    isLoading.value = false;
  }
};

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

// Tính toán công nợ
const tienConNo = computed(() => {
  if (!orderData.value) return 0;
  return Math.max(0, Number(orderData.value.tonggiatri) - Number(orderData.value.tiendathanhtoan || 0));
});

// Sinh mã VietQR linh động dựa trên số tiền còn nợ
const vietQrUrl = computed(() => {
  if (!orderData.value || tienConNo.value <= 0) return '';
  const amount = Math.round(tienConNo.value);
  const addInfo = `Thanh toan don hang XUAT${orderData.value.madonhang}`;
  // Thay thế bằng tài khoản thật của bạn nếu muốn
  const base = 'https://api.vietqr.io/image/970436-1042328265-wp5fFpl.jpg?accountName=TRAN%20TUAN%20DAT';
  return `${base}&amount=${amount}&addInfo=${encodeURIComponent(addInfo)}`;
});

// Tính toán bước trên timeline
const step = computed(() => {
  if (!orderData.value) return 0;
  const status = orderData.value.trangthai;
  if (status === 'huy') return -1;
  if (status === 'choduyet') return 1;
  if (status === 'daduyet') return 2;
  if (status === 'hoanthanh') return 3;
  return 1;
});
</script>

<template>
  <!-- Layout chiếm toàn màn hình, không có Sidebar -->
  <div class="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 py-12">
    
    <!-- Header / Logo -->
    <div class="mb-8 text-center">
      <div class="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-black mx-auto shadow-lg mb-3">
        📦
      </div>
      <h1 class="text-3xl font-black text-gray-800 tracking-tight">Tra Cứu Đơn Hàng</h1>
      <p class="text-gray-500 mt-2 text-sm">Theo dõi trạng thái và thanh toán dễ dàng</p>
    </div>

    <!-- KHUNG TÌM KIẾM -->
    <div class="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border border-gray-100">
      <form @submit.prevent="handleSearch" class="p-6 sm:p-8 space-y-5">
        <div v-if="errorMsg" class="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium text-center border border-red-100">
          {{ errorMsg }}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Mã vận đơn (Tracking)</label>
            <input v-model="mavandon3pl" type="text" placeholder="VD: VNPOST-..." class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-gray-700">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Số điện thoại đặt hàng</label>
            <input v-model="sodienthoai" type="tel" placeholder="09xxxx..." class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-gray-700">
          </div>
        </div>
        
        <button type="submit" :disabled="isLoading" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:bg-gray-400 flex justify-center items-center gap-2">
          <span v-if="isLoading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ isLoading ? 'Đang tra cứu...' : 'Tra cứu ngay' }}
        </button>
      </form>
    </div>

    <!-- KHUNG KẾT QUẢ -->
    <div v-if="orderData" class="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-fade-in-up">
      
      <!-- Banner Trạng thái -->
      <div class="p-6 sm:p-8 bg-slate-800 text-white flex flex-wrap justify-between items-center gap-4">
        <div>
          <p class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Mã đơn hàng nội bộ</p>
          <h2 class="text-3xl font-black">#{{ orderData.madonhang }}</h2>
          <p class="text-sm text-slate-300 mt-2">Khách hàng: <span class="font-bold text-white">{{ orderData.tendoitac }}</span></p>
        </div>
        <div class="text-right">
          <p class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Ngày đặt hàng</p>
          <p class="font-semibold">{{ new Date(orderData.ngaytao).toLocaleString('vi-VN') }}</p>
          <p v-if="orderData.mavandon3pl" class="mt-2 text-sm">
            Mã Vận Đơn: <span class="bg-blue-500 text-white px-2 py-0.5 rounded font-mono">{{ orderData.mavandon3pl }}</span>
          </p>
        </div>
      </div>

      <!-- Timeline Tracking -->
      <div class="px-6 py-10 sm:px-12 border-b">
        <h3 class="text-sm font-bold text-gray-800 uppercase tracking-widest mb-8 text-center">Tiến trình đơn hàng</h3>
        
        <div v-if="step === -1" class="text-center p-6 bg-red-50 rounded-2xl border border-red-100">
          <span class="text-4xl">❌</span>
          <h4 class="text-xl font-bold text-red-600 mt-3">Đơn hàng đã bị hủy</h4>
          <p class="text-gray-500 text-sm mt-1">Rất tiếc, đơn hàng này đã bị từ chối hoặc hủy bỏ.</p>
        </div>

        <div v-else class="relative flex justify-between">
          <!-- Line background -->
          <div class="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
          <!-- Line progress -->
          <div class="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 rounded-full z-0 transition-all duration-700" :style="{ width: step === 1 ? '10%' : step === 2 ? '50%' : '100%' }"></div>

          <!-- Bước 1 -->
          <div class="relative z-10 flex flex-col items-center">
            <div :class="step >= 1 ? 'bg-blue-500 text-white shadow-blue-200' : 'bg-white text-gray-400 border-2 border-gray-200'" class="w-10 h-10 rounded-full flex justify-center items-center font-bold shadow-lg transition-colors">1</div>
            <p class="mt-3 text-xs font-bold" :class="step >= 1 ? 'text-gray-800' : 'text-gray-400'">Đã tiếp nhận</p>
          </div>
          
          <!-- Bước 2 -->
          <div class="relative z-10 flex flex-col items-center">
            <div :class="step >= 2 ? 'bg-blue-500 text-white shadow-blue-200' : 'bg-white text-gray-400 border-2 border-gray-200'" class="w-10 h-10 rounded-full flex justify-center items-center font-bold shadow-lg transition-colors">2</div>
            <p class="mt-3 text-xs font-bold" :class="step >= 2 ? 'text-gray-800' : 'text-gray-400'">Đã xuất kho</p>
          </div>

          <!-- Bước 3 -->
          <div class="relative z-10 flex flex-col items-center">
            <div :class="step >= 3 ? 'bg-blue-500 text-white shadow-blue-200' : 'bg-white text-gray-400 border-2 border-gray-200'" class="w-10 h-10 rounded-full flex justify-center items-center font-bold shadow-lg transition-colors">3</div>
            <p class="mt-3 text-xs font-bold" :class="step >= 3 ? 'text-gray-800' : 'text-gray-400'">Hoàn thành</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3">
        <!-- Chi tiết sản phẩm -->
        <div class="md:col-span-2 p-6 sm:p-8 bg-gray-50/50">
          <h3 class="font-bold text-gray-800 uppercase text-sm mb-4">Chi tiết mặt hàng</h3>
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table class="w-full text-left text-sm">
              <thead class="bg-gray-50 border-b">
                <tr class="text-xs text-gray-500 uppercase">
                  <th class="p-4 font-bold">Sản phẩm</th>
                  <th class="p-4 font-bold text-center">Số lượng</th>
                  <th class="p-4 font-bold text-right">Đơn giá</th>
                  <th class="p-4 font-bold text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="(item, index) in orderData.chitiet" :key="index" class="hover:bg-gray-50">
                  <td class="p-4 font-medium text-gray-800">{{ item.tenthuoc }}</td>
                  <td class="p-4 text-center text-blue-600 font-bold">{{ item.soluongthucte }}</td>
                  <td class="p-4 text-right text-gray-500">{{ formatCurrency(item.dongia) }}</td>
                  <td class="p-4 text-right font-bold text-gray-800">{{ formatCurrency(item.thanhtien) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Thanh toán & QR -->
        <div class="p-6 sm:p-8 border-t md:border-t-0 md:border-l border-gray-100 bg-white flex flex-col justify-between">
          <div class="space-y-4 mb-8">
            <h3 class="font-bold text-gray-800 uppercase text-sm mb-4">Tổng thanh toán</h3>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Tổng giá trị đơn</span>
              <span class="font-bold text-gray-700">{{ formatCurrency(orderData.tonggiatri) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Đã thanh toán</span>
              <span class="font-bold text-green-600">- {{ formatCurrency(orderData.tiendathanhtoan) }}</span>
            </div>
            <div class="flex justify-between items-center pt-3 border-t border-gray-200">
              <span class="font-bold text-gray-800">Khách cần trả</span>
              <span class="text-2xl font-black text-red-600">{{ formatCurrency(tienConNo) }}</span>
            </div>
          </div>

          <div v-if="tienConNo > 0 && vietQrUrl" class="bg-blue-50 rounded-2xl p-4 flex flex-col items-center border border-blue-100">
            <p class="text-xs font-bold text-blue-800 uppercase mb-3 text-center">Quét QR Thanh Toán</p>
            <div class="bg-white p-2 rounded-xl shadow-sm">
              <img :src="vietQrUrl" alt="VietQR" class="w-40 h-40 object-contain rounded-lg mix-blend-multiply" />
            </div>
            <p class="text-[10px] text-gray-500 mt-3 text-center w-full truncate" title="Sẽ được tự động điền khi quét">
              ND: Thanh toan don hang XUAT{{ orderData.madonhang }}
            </p>
          </div>

          <div v-else-if="tienConNo === 0" class="bg-green-50 rounded-2xl p-6 text-center border border-green-100">
            <div class="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3">✓</div>
            <h4 class="font-bold text-green-700">Đã thanh toán đủ</h4>
            <p class="text-xs text-green-600 mt-1">Cảm ơn bạn đã giao dịch!</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>