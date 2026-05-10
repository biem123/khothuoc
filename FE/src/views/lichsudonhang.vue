<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';

const danhSachDonHang = ref<any[]>([]);
const danhSachDonVi = ref<any[]>([]);
const isLoading = ref(false);

// Bộ lọc
const searchQuery = ref('');
const filterLoai = ref('all'); // all | nhap | xuat
const filterTrangThai = ref('all'); // all | choduyet | daduyet | huy

// --- STATE CHO MODAL CHI TIẾT ---
const showDetailModal = ref(false);
const isLoadingDetail = ref(false);
const selectedMaster = ref<any>(null);
const selectedDetails = ref<any[]>([]);

const loadData = async () => {
  isLoading.value = true;
  try {
    const [resDH, resDV]: any = await Promise.all([
      api.get('/donhang'),
      api.get('/donvitinh')
    ]);
    danhSachDonHang.value = resDH.data;
    danhSachDonVi.value = resDV.data || [];
  } catch (error) {
    console.error('Lỗi tải dữ liệu lịch sử đơn hàng:', error);
  } finally {
    isLoading.value = false;
  }
};

// --- LOGIC LỌC ĐA TẦNG ---
const filteredDonHang = computed(() => {
  return danhSachDonHang.value.filter((dh: any) => {
    // 1. Lọc theo Text (Mã ĐH, Tên Khách/NCC)
    const query = searchQuery.value.trim().toLowerCase();
    const matchText = !query || 
                      String(dh.madonhang).includes(query) || 
                      (dh.tendoitac && dh.tendoitac.toLowerCase().includes(query));

    // 2. Lọc theo Loại (Nhập / Xuất)
    const loai = String(dh.loaidonhang || '').trim().toLowerCase();
    const matchLoai = filterLoai.value === 'all' || loai === filterLoai.value;

    // 3. Lọc theo Trạng thái
    const matchTrangThai = filterTrangThai.value === 'all' || dh.trangthai === filterTrangThai.value;

    return matchText && matchLoai && matchTrangThai;
  }).sort((a, b) => new Date(b.ngaytao).getTime() - new Date(a.ngaytao).getTime()); // Sắp xếp mới nhất lên đầu
});

const normalizeMaster = (data: any) => (Array.isArray(data) ? data[0] : data);

// --- HÀM MỞ CHI TIẾT ---
const openDetail = async (dh: any) => {
  showDetailModal.value = true;
  isLoadingDetail.value = true;
  selectedMaster.value = null;
  selectedDetails.value = [];

  try {
    const [resMaster, resDetails]: any = await Promise.all([
      api.get(`/donhang/${dh.madonhang}`),
      api.get(`/chitietdonhang/donhang/${dh.madonhang}`)
    ]);
    
    const master = normalizeMaster(resMaster.data) || {};
    selectedMaster.value = { ...master, loaidonhang: dh.loaidonhang };
    selectedDetails.value = resDetails.data || [];
  } catch (error: any) {
    alert("Lỗi tải chi tiết: " + (error.response?.data?.message || error.message || "Lỗi hệ thống"));
  } finally {
    isLoadingDetail.value = false;
  }
};

const closeDetail = () => {
  showDetailModal.value = false;
  selectedMaster.value = null;
  selectedDetails.value = [];
};

const getTenDonVi = (row: any) => {
  if (row?.tendonvi || row?.donvi) return row.tendonvi || row.donvi;
  const ma = row?.madonvitinh;
  if (!ma) return '---';
  const dv = danhSachDonVi.value.find((d: any) => d.madonvitinh === ma);
  return dv?.tendonvi || ma || '---';
};

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

onMounted(() => loadData());
</script>

<template>
  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-screen">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">📜 Lịch sử Giao dịch</h2>
      <button @click="loadData" class="text-gray-500 hover:text-blue-600 font-medium text-sm flex items-center gap-1 transition">
        🔄 Làm mới dữ liệu
      </button>
    </div>

    <div class="flex flex-wrap gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
      <div class="flex-1 min-w-[200px]">
        <label class="block text-[11px] font-bold text-gray-500 uppercase mb-1">Tìm kiếm</label>
        <div class="relative">
          <input v-model="searchQuery" type="text" placeholder="Tìm mã đơn, tên đối tác..." class="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500">
          <span class="absolute right-3 top-2.5 text-gray-400">🔍</span>
        </div>
      </div>
      
      <div class="w-48">
        <label class="block text-[11px] font-bold text-gray-500 uppercase mb-1">Phân loại</label>
        <select v-model="filterLoai" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">Tất cả</option>
          <option value="nhap">📦 Phiếu Nhập Kho</option>
          <option value="xuat">🚚 Đơn Xuất Kho</option>
        </select>
      </div>

      <div class="w-48">
        <label class="block text-[11px] font-bold text-gray-500 uppercase mb-1">Trạng thái</label>
        <select v-model="filterTrangThai" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">Tất cả trạng thái</option>
          <option value="choduyet">⏳ Chờ duyệt</option>
          <option value="daduyet">✅ Đã hoàn thành</option>
          <option value="huy">❌ Đã hủy</option>
        </select>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-10 text-gray-500">Đang tải lịch sử giao dịch...</div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="text-xs text-gray-500 uppercase border-b bg-white">
            <th class="p-4 font-bold">Mã ĐH</th>
            <th class="p-4 font-bold">Loại</th>
            <th class="p-4 font-bold">Người Lập Phiếu</th>
            <th class="p-4 font-bold">Đối Tác</th>
            <th class="p-4 font-bold text-right">Tổng Tiền</th>
            <th class="p-4 font-bold">Ngày Tạo</th>
            <th class="p-4 font-bold text-center">Trạng Thái</th>
            <th class="p-4 font-bold text-center">Hành Động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dh in filteredDonHang" :key="dh.madonhang" class="border-b border-dashed hover:bg-gray-50 transition">
            <td class="p-4 font-black text-gray-800">#{{ dh.madonhang }}</td>
            <td class="p-4">
               <span :class="String(dh.loaidonhang || '').trim().toLowerCase() === 'nhap' ? 'text-purple-700 bg-purple-50 border-purple-200' : 'text-blue-700 bg-blue-50 border-blue-200'" class="px-2 py-1 font-bold text-[10px] rounded border uppercase inline-block">
                {{ String(dh.loaidonhang || '').trim().toLowerCase() === 'nhap' ? '📦 Nhập' : '🚚 Xuất' }}
              </span>
            </td>
            
            <td class="p-4">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                  {{ dh.tendangnhap ? dh.tendangnhap.charAt(0).toUpperCase() : 'U' }}
                </div>
                <span class="font-medium text-gray-700 text-sm">{{ dh.tendangnhap || `TK#${dh.mataikhoan}` }}</span>
              </div>
            </td>

            <td class="p-4 text-gray-700 font-medium text-sm">{{ dh.tendoitac }}</td>
            <td class="p-4 text-red-600 font-bold text-right">{{ formatCurrency(dh.tonggiatri) }}</td>
            <td class="p-4 text-gray-500 text-xs font-medium">{{ new Date(dh.ngaytao).toLocaleString('vi-VN') }}</td>
            
            <td class="p-4 text-center">
              <span v-if="dh.trangthai === 'choduyet'" class="px-2 py-1 bg-yellow-100 text-yellow-700 text-[11px] font-bold rounded">Đợi duyệt</span>
              <span v-else-if="dh.trangthai === 'daduyet'" class="px-2 py-1 bg-green-100 text-green-700 text-[11px] font-bold rounded">Đã duyệt</span>
              <span v-else class="px-2 py-1 bg-gray-100 text-gray-500 text-[11px] font-bold rounded">Đã hủy</span>
            </td>
            
            <td class="p-4 text-center">
              <button @click="openDetail(dh)" class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded transition">
                Chi tiết
              </button>
            </td>
          </tr>
          <tr v-if="filteredDonHang.length === 0">
            <td colspan="8" class="p-16 text-center text-gray-400">
              <span class="text-4xl block mb-2">📭</span>
              <p class="text-sm">Không tìm thấy đơn hàng nào phù hợp với bộ lọc.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div v-if="showDetailModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
      <div class="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
        <div>
          <h3 class="text-xl font-bold text-gray-800">
            Chi tiết {{ selectedMaster?.loaidonhang === 'nhap' ? 'Phiếu Nhập' : 'Đơn Xuất' }} 
            <span class="text-blue-600">#{{ selectedMaster?.madonhang }}</span>
          </h3>
        </div>
        <button @click="closeDetail" class="text-gray-400 hover:text-red-500 text-2xl font-bold transition">&times;</button>
      </div>

      <div v-if="isLoadingDetail" class="p-10 text-center text-gray-500">Đang tải chi tiết...</div>

      <div v-else class="p-6 overflow-y-auto flex-1 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div>
            <p class="text-xs text-gray-500 uppercase font-bold">Đối tác</p>
            <p class="font-bold text-gray-800">{{ selectedMaster?.tendoitac || '---' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase font-bold">Người lập phiếu</p>
            <p class="font-bold text-gray-800">{{ selectedMaster?.tendangnhap || '---' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase font-bold">Ngày tạo</p>
            <p class="font-bold text-gray-800">{{ new Date(selectedMaster?.ngaytao || Date.now()).toLocaleString('vi-VN') }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase font-bold">Trạng thái</p>
            <span v-if="selectedMaster?.trangthai === 'choduyet'" class="text-yellow-600 font-bold text-sm">⏳ Chờ duyệt</span>
            <span v-else-if="selectedMaster?.trangthai === 'daduyet'" class="text-green-600 font-bold text-sm">✅ Đã duyệt</span>
            <span v-else class="text-gray-500 font-bold text-sm">❌ Đã hủy</span>
          </div>
     
        </div>

        <div class="bg-white border rounded-xl overflow-hidden">
          <div class="px-5 py-3 border-b bg-gray-50">
            <h4 class="font-bold text-gray-800 uppercase text-sm">Danh sách hàng hóa</h4>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[11px] text-gray-500 uppercase bg-gray-50 border-b">
                  <th class="px-5 py-3 font-bold">Tên thuốc</th>
                  <th class="px-5 py-3 font-bold">Số lô</th>
                  <th class="px-5 py-3 font-bold">Đơn vị</th>
                  <th class="px-5 py-3 font-bold text-right">Số lượng</th>
                  <th class="px-5 py-3 font-bold text-right">Đơn giá</th>
                  <th class="px-5 py-3 font-bold text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr v-for="row in selectedDetails" :key="row.id || row.machitiet" class="hover:bg-gray-50">
                  <td class="px-5 py-3 text-sm font-medium text-gray-800">{{ row.tenthuoc || row.tenThuoc || '---' }}</td>
                  <td class="px-5 py-3 text-sm text-gray-600 font-bold">{{ row.solo || row.solo_tam || row.malo || '---' }}</td>
                  <td class="px-5 py-3 text-sm text-gray-600">{{ getTenDonVi(row) }}</td>
                  <td class="px-5 py-3 text-sm text-right text-blue-600 font-bold">{{ row.soluongthucte ?? row.soluongyeucau ?? 0 }}</td>
                  <td class="px-5 py-3 text-sm text-right text-gray-700">{{ formatCurrency(row.dongia ?? row.gianhap ?? 0) }}</td>
                  <td class="px-5 py-3 text-sm text-right font-black text-gray-800">
                    {{ formatCurrency((Number(row.soluongthucte ?? row.soluongyeucau ?? 0)) * (Number(row.dongia ?? row.gianhap ?? 0))) }}
                  </td>
                </tr>
                <tr v-if="selectedDetails.length === 0">
                  <td colspan="6" class="px-5 py-8 text-center text-gray-400 italic">Không có dữ liệu chi tiết.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex justify-end">
          <div class="w-80 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div class="flex justify-between mb-2 text-sm text-orange-600 font-medium">
              <span>Chiết khấu:</span>
              <span>- {{ formatCurrency(selectedMaster?.tienchietkhau || 0) }}</span>
            </div>
            <div class="flex justify-between mb-2 text-sm text-blue-600 font-bold border-t pt-2">
              <span>Cần thanh toán:</span>
              <span>{{ formatCurrency(selectedMaster?.tonggiatri || 0) }}</span>
            </div>
            <div class="flex justify-between text-sm text-green-600 font-bold">
              <span>Đã thanh toán (Đã trả):</span>
              <span>- {{ formatCurrency(selectedMaster?.tiendathanhtoan || 0) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 border-t bg-gray-50 flex justify-end">
        <button @click="closeDetail" class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition">Đóng</button>
      </div>
    </div>
  </div>
</template>