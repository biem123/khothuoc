<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const danhSachPhieu = ref([]);
const danhSachLo = ref([]); // Lấy danh sách lô để nhân viên chọn kiểm kê
const isLoading = ref(false);
const showForm = ref(false);
const searchQuery = ref('');

// --- STATE CHO MODAL CHI TIẾT ---
const showDetailModal = ref(false);
const isLoadingDetail = ref(false);
const selectedMaster = ref<any>(null);
const selectedDetails = ref<any[]>([]);

// Form tạo phiếu mới
const masterForm = ref({
  maphieu: '',
  ngaykiemke: new Date().toISOString().split('T')[0],
  nguoitao: authStore.user?.tendangnhap || 'NhanVien',
  trangthai: 'dangkhiemke'
});

const chiTietKiemKe = ref<any[]>([]);

const loadData = async () => {
  isLoading.value = true;
  try {
    const [resPhieu, resLo]: any = await Promise.all([
      api.get('/phieukiemke'),
      api.get('/lothuoc')
    ]);
    danhSachPhieu.value = resPhieu.data;
    danhSachLo.value = resLo.data;
  } catch (error) {
    console.error('Lỗi tải dữ liệu kiểm kê:', error);
  } finally {
    isLoading.value = false;
  }
};

const openForm = () => {
  const now = new Date();
  const timestamp = now.getTime();
  masterForm.value.maphieu = `PKK-${timestamp}`;
  chiTietKiemKe.value = [];
  showForm.value = true;
};

// --- HÀM MỞ POPUP CHI TIẾT KIỂM KÊ ---
const openDetail = async (phieu: any) => {
  selectedMaster.value = phieu;
  showDetailModal.value = true;
  isLoadingDetail.value = true;
  selectedDetails.value = [];

  try {
    // Gọi API lấy chi tiết của phiếu kiểm kê này
    const res: any = await api.get(`/chitietkiemke/phieu/${phieu.maphieu}`);
    selectedDetails.value = res.data;
  } catch (error: any) {
    alert("Lỗi tải chi tiết kiểm kê: " + (error.message || "Lỗi hệ thống"));
  } finally {
    isLoadingDetail.value = false;
  }
};

const closeDetail = () => {
  showDetailModal.value = false;
  selectedMaster.value = null;
  selectedDetails.value = [];
};

const themDongKiemKe = () => {
  chiTietKiemKe.value.push({
    malo: '',
    ton_he_thong: 0,
    soluong_thuc_te: 0,
    soluong_tru: 0,
    lydo: ''
  });
};

const xoaDong = (index: number) => chiTietKiemKe.value.splice(index, 1);

// Khi chọn lô, tự động điền tồn kho hiện tại trong hệ thống
const handleChonLo = (item: any) => {
  const loSelected = danhSachLo.value.find((l: any) => l.malo === item.malo);
  if (loSelected) {
    item.ton_he_thong = loSelected.tonthucte;
    tinhToanLech(item);
  }
};

const tinhToanLech = (item: any) => {
  // soluong_tru = Tồn hệ thống - Số đếm thực tế
  // Nếu > 0: hụt hàng | Nếu < 0: dư hàng
  item.soluong_tru = Number(item.ton_he_thong) - Number(item.soluong_thuc_te);
};

const getTonHeThong = (row: any) => {
  const val = row?.ton_he_thong ?? row?.tonhethong ?? row?.tonthucte;
  return val === undefined || val === null ? null : Number(val);
};

const getSoDemThucTe = (row: any) => {
  const explicit = row?.sodemthucte ?? row?.soluong_thucte;
  if (explicit !== undefined && explicit !== null) return Number(explicit);
  const tonHeThong = getTonHeThong(row);
  if (tonHeThong === null) return null;
  return tonHeThong - Number(row?.soluong_tru || 0);
};

const handleSaveKiemKe = async () => {
  if (chiTietKiemKe.value.length === 0) {
    alert("Vui lòng thêm ít nhất một mặt hàng để kiểm kê!");
    return;
  }

  try {
    isLoading.value = true;
    // 1. Tạo phiếu tổng (Master)
    await api.post('/phieukiemke', masterForm.value);

    // 2. Tạo chi tiết cho từng dòng
    const promises = chiTietKiemKe.value.map(item => {
      return api.post('/chitietkiemke', {
        maphieu: masterForm.value.maphieu,
        malo: item.malo,
        soluong_tru: item.soluong_tru,
        lydo: item.lydo
      });
    });

    await Promise.all(promises);
    alert('Đã gửi phiếu kiểm kê! Chờ Admin phê duyệt để cập nhật kho.');
    showForm.value = false;
    loadData();
  } catch (error: any) {
    alert("Lỗi khi lưu phiếu kiểm kê: " + error.message);
  } finally {
    isLoading.value = false;
  }
};

const displayedPhieu = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return danhSachPhieu.value;
  return danhSachPhieu.value.filter((p: any) => 
    p.maphieu.toLowerCase().includes(query) || p.nguoitao.toLowerCase().includes(query)
  );
});

onMounted(() => loadData());
</script>

<template>
  <div v-if="!showForm" class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Lịch sử Kiểm kê kho</h2>
      <div class="flex gap-4">
        <div class="relative">
          <input v-model="searchQuery" type="text" placeholder="Tìm mã phiếu..." class="pl-4 pr-10 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none w-64">
          <span class="absolute right-3 top-2 text-gray-400 font-bold">🔍</span>
        </div>
        <button v-if="!authStore.isAdmin" @click="openForm" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition">
          + Tạo phiếu kiểm kê
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-10 text-gray-500 font-medium italic">Đang tải dữ liệu...</div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-gray-500 text-xs uppercase border-b">
            <th class="p-4 font-bold">Mã Phiếu</th>
            <th class="p-4 font-bold">Ngày thực hiện</th>
            <th class="p-4 font-bold">Người tạo</th>
            <th class="p-4 font-bold">Trạng thái</th>
            <th class="p-4 font-bold text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="phieu in displayedPhieu" :key="phieu.maphieu" class="border-b hover:bg-gray-50 transition">
            <td class="p-4 font-bold text-gray-800">{{ phieu.maphieu }}</td>
            <td class="p-4 text-gray-600 text-sm">{{ new Date(phieu.ngaykiemke).toLocaleString('vi-VN') }}</td>
            <td class="p-4 font-medium text-gray-700">{{ phieu.nguoitao }}</td>
            <td class="p-4">
              <span v-if="phieu.trangthai === 'hoanthanh'" class="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-black uppercase border border-green-200">Hoàn thành</span>
              <span v-else class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-[10px] font-black uppercase border border-yellow-200">Đang đợi duyệt</span>
            </td>
            <td class="p-4 text-center flex justify-center gap-2">
              <button @click="openDetail(phieu)" class="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-bold rounded hover:bg-gray-200 transition">Xem chi tiết</button>
            </td>
          </tr>
          <tr v-if="displayedPhieu.length === 0">
            <td colspan="5" class="p-10 text-center text-gray-400">Không tìm thấy dữ liệu kiểm kê nào.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showDetailModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        <div class="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <div>
            <h3 class="text-xl font-bold text-gray-800">
              Chi tiết Phiếu Kiểm Kê <span class="text-orange-600">#{{ selectedMaster?.maphieu }}</span>
            </h3>
          </div>
          <button @click="closeDetail" class="text-gray-400 hover:text-red-500 text-3xl leading-none font-bold transition">&times;</button>
        </div>

        <div v-if="isLoadingDetail" class="p-16 text-center text-gray-500">Đang tải dữ liệu chi tiết...</div>

        <div v-else class="p-6 overflow-y-auto flex-1 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 rounded-xl p-5 border border-gray-200">
            <div>
              <p class="text-xs text-gray-500 uppercase font-bold">Nhân viên kiểm kê</p>
              <p class="font-bold text-gray-800">{{ selectedMaster?.nguoitao || '---' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase font-bold">Thời gian lập phiếu</p>
              <p class="font-bold text-gray-800">{{ new Date(selectedMaster?.ngaykiemke).toLocaleString('vi-VN') }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase font-bold">Trạng thái kho</p>
              <span v-if="selectedMaster?.trangthai === 'hoanthanh'" class="text-green-600 font-bold text-sm">✅ Đã bù trừ kho</span>
              <span v-else class="text-yellow-600 font-bold text-sm">⏳ Chờ Admin duyệt</span>
            </div>
          </div>

          <div class="bg-white border rounded-xl overflow-hidden shadow-sm">
            <div class="px-5 py-3 border-b bg-gray-50">
              <h4 class="font-bold text-gray-800 uppercase text-sm">Danh sách đối soát</h4>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left">
                <thead>
                  <tr class="text-[11px] text-gray-500 uppercase bg-gray-50 border-b">
                    <th class="px-5 py-3 font-bold">Lô thuốc</th>
                    <th class="px-5 py-3 font-bold text-center">Tồn hệ thống</th>
                    <th class="px-5 py-3 font-bold text-center">Số đếm thực tế</th>
                    <th class="px-5 py-3 font-bold text-center">Chênh lệch</th>
                    <th class="px-5 py-3 font-bold">Lý do / Ghi chú</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr v-for="row in selectedDetails" :key="row.id || row.machitiet" class="hover:bg-gray-50 transition">
                    <td class="px-5 py-3 text-sm font-bold text-gray-800">{{ row.solo || row.malo || '---' }}</td>
                    <td class="px-5 py-3 text-sm text-center text-gray-500 font-medium">
                      {{ getTonHeThong(row) ?? '---' }}
                    </td>
                    <td class="px-5 py-3 text-sm text-center font-bold text-blue-600">
                      {{ getSoDemThucTe(row) ?? '---' }}
                    </td>
                    <td class="px-5 py-3 text-sm text-center font-black" :class="Number(row.soluong_tru) > 0 ? 'text-red-600' : Number(row.soluong_tru) < 0 ? 'text-green-600' : 'text-gray-400'">
                      {{ Number(row.soluong_tru) > 0 ? `-${row.soluong_tru} (Thiếu)` : Number(row.soluong_tru) < 0 ? `+${Math.abs(row.soluong_tru)} (Dư)` : '0 (Khớp)' }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-600 italic">{{ row.lydo || 'Không có ghi chú' }}</td>
                  </tr>
                  <tr v-if="selectedDetails.length === 0">
                    <td colspan="5" class="px-5 py-8 text-center text-gray-400 italic">Không có dữ liệu đối soát.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button @click="closeDetail" class="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl shadow-sm transition">Đóng lại</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="bg-gray-50 -m-6 p-6 min-h-screen">
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-4">
          <button @click="showForm = false" class="w-10 h-10 bg-white rounded-full shadow flex justify-center items-center text-gray-600 font-bold hover:bg-gray-100">←</button>
          <h2 class="text-2xl font-bold text-gray-800">Lập Phiếu Kiểm Kê Mới</h2>
        </div>
        <button @click="handleSaveKiemKe" :disabled="isLoading" class="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-xl font-bold shadow-lg transition disabled:bg-gray-400">
          Gửi Phiếu Duyệt
        </button>
      </div>

      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-3 bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-fit space-y-4">
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Mã Phiếu Tự Động</label>
            <input v-model="masterForm.maphieu" readonly class="w-full px-3 py-2 bg-gray-50 border rounded-lg font-mono text-sm text-gray-500">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Nhân Viên Kiểm Kê</label>
            <input v-model="masterForm.nguoitao" readonly class="w-full px-3 py-2 bg-gray-50 border rounded-lg font-bold text-blue-600 text-sm">
          </div>
          <div class="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p class="text-[11px] text-blue-700 leading-relaxed">
              <b>Lưu ý:</b> Sau khi gửi, Admin sẽ kiểm tra lại số lượng lệch trước khi cập nhật tồn kho chính thức.
            </p>
          </div>
        </div>

        <div class="col-span-9 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div class="flex justify-between items-center border-b pb-3 mb-4">
            <h3 class="font-bold text-gray-700 text-sm uppercase">Danh sách mặt hàng kiểm đếm</h3>
            <button @click="themDongKiemKe" class="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-xs font-bold border border-blue-200 transition">
              + Chọn Lô Kiểm Kê
            </button>
          </div>

          <table class="w-full text-left">
            <thead>
              <tr class="text-[10px] text-gray-400 uppercase border-b">
                <th class="p-3 font-bold w-1/3">Lô Thuốc</th>
                <th class="p-3 font-bold text-center">Tồn HT</th>
                <th class="p-3 font-bold text-center">Thực Tế</th>
                <th class="p-3 font-bold text-center">Chênh Lệch</th>
                <th class="p-3 font-bold">Lý do / Ghi chú</th>
                <th class="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in chiTietKiemKe" :key="index" class="border-b border-dashed hover:bg-gray-50 transition">
                <td class="p-2">
                  <select v-model="item.malo" @change="handleChonLo(item)" class="w-full px-2 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="" disabled>-- Chọn lô thuốc --</option>
                    <option v-for="lo in danhSachLo" :key="lo.malo" :value="lo.malo">
                      {{ lo.solo }} - {{ lo.tenthuoc }}
                    </option>
                  </select>
                </td>
                <td class="p-2 text-center font-bold text-gray-500">{{ item.ton_he_thong }}</td>
                <td class="p-2">
                  <input v-model.number="item.soluong_thuc_te" @input="tinhToanLech(item)" type="number" class="w-24 px-2 py-2 border border-blue-300 rounded-md text-center font-black text-blue-700 bg-blue-50 outline-none focus:ring-2 focus:ring-blue-500">
                </td>
                <td class="p-2 text-center">
                  <span :class="item.soluong_tru > 0 ? 'text-red-600' : item.soluong_tru < 0 ? 'text-green-600' : 'text-gray-400'" class="font-black">
                    {{ item.soluong_tru > 0 ? '-' + item.soluong_tru : (item.soluong_tru < 0 ? '+' + Math.abs(item.soluong_tru) : '0') }}
                  </span>
                </td>
                <td class="p-2">
                  <input v-model="item.lydo" type="text" placeholder="Lý do lệch..." class="w-full px-2 py-2 border rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-500">
                </td>
                <td class="p-2 text-center">
                  <button @click="xoaDong(index)" class="text-gray-300 hover:text-red-500 font-bold text-xl transition">×</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="chiTietKiemKe.length === 0" class="py-20 text-center text-gray-400 italic text-sm">
            Bấm "+ Chọn Lô Kiểm Kê" để bắt đầu nhập dữ liệu đếm thực tế.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>