<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const danhSachDonHang = ref([]);
const danhSachNhaCungCap = ref([]);
const danhSachThuoc = ref([]);
const danhSachDonVi = ref([]);

const isLoading = ref(false);
const showForm = ref(false);

const nhaCungCapDuocChon = computed(() => {
  if (!masterForm.value.madoitac) return null;
  return danhSachNhaCungCap.value.find((dt: any) => dt.madoitac === masterForm.value.madoitac);
});

// Thông tin chung của Phiếu Nhập
const masterForm = ref({
  madoitac: '',
  sohoadongtgt: '',
  tienchietkhau: 0,
  tiendathanhtoan: 0 
});

const chiTietData = ref<any[]>([]);

// --- STATE CHO MODAL CHI TIẾT ---
const showDetailModal = ref(false);
const isLoadingDetail = ref(false);
const selectedMaster = ref<any>(null);
const selectedDetails = ref<any[]>([]);

const loadData = async () => {
  isLoading.value = true;
  try {
    const [resDH, resDT, resThuoc, resDV]: any = await Promise.all([
      api.get('/donhang/loai/nhap'), 
      api.get('/doitac/loai/NhaCungCap'), 
      api.get('/thuoc'),
      api.get('/donvitinh')
    ]);
    const donHangData = resDH.data || [];
    danhSachDonHang.value = donHangData.map((dh: any) => ({
      ...dh,
      tonggiatri: Number(dh.tonggiatri) || 0,
      tienchietkhau: Number(dh.tienchietkhau) || 0,
      tiendathanhtoan: Number(dh.tiendathanhtoan) || 0
    }));
    danhSachNhaCungCap.value = resDT.data.filter((dt: any) => dt.trangthai === 'Dang hop tac');
    danhSachThuoc.value = resThuoc.data.filter((t: any) => Number(t.trangthai) === 1);
    danhSachDonVi.value = resDV.data;
  } catch (error) {
    console.error('Lỗi tải dữ liệu:', error);
  } finally {
    isLoading.value = false;
  }
};

const openForm = () => {
  masterForm.value = { madoitac: '', sohoadongtgt: '', tienchietkhau: 0, tiendathanhtoan: 0 };
  chiTietData.value = [];
  showForm.value = true;
};

const closeForm = () => showForm.value = false;

// --- HÀM MỞ POPUP CHI TIẾT ĐƠN HÀNG ---
const openDetail = async (dh: any) => {
  showDetailModal.value = true;
  isLoadingDetail.value = true;
  selectedDetails.value = [];
  selectedMaster.value = null;

  try {
    const [resMaster, resDetails]: any = await Promise.all([
      api.get(`/donhang/${dh.madonhang}`),
      api.get(`/chitietdonhang/donhang/${dh.madonhang}`)
    ]);
    selectedMaster.value = resMaster.data || dh;
    selectedDetails.value = resDetails.data || [];
  } catch (error: any) {
    alert("Lỗi tải chi tiết: " + (error.message || "Lỗi hệ thống"));
  } finally {
    isLoadingDetail.value = false;
  }
};

const generateLotNumber = () => {
  const yy = String(new Date().getFullYear()).slice(-2);
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `LOT-${yy}-${randomPart}`;
};

const themDongChiTiet = () => {
  chiTietData.value.push({ 
    mathuoc: '', madonvitinh: '', solo: generateLotNumber(), hansudung: '', 
    ngaysanxuat: '',
    soluongyeucau: 1, 
    soluongthucte: 1, 
    gianhap: 0 
  });
};

const xoaDong = (index: number) => chiTietData.value.splice(index, 1);

const getDonViTheoThuoc = (mathuoc: any) => danhSachDonVi.value.filter((dv: any) => dv.mathuoc === mathuoc);

const handleChonThuoc = (item: any) => {
  item.madonvitinh = '';
};

// --- LOGIC CHẶN NHẬP DƯ SỐ LƯỢNG ---
const validateSoLuong = (item: any) => {
  if (item.soluongthucte > item.soluongyeucau) {
    alert(`LỖI: Số lượng thực nhận (${item.soluongthucte}) không được lớn hơn số lượng trên chứng từ (${item.soluongyeucau})!\nVui lòng lập biên bản thừa hàng nếu NCC giao dư.`);
    item.soluongthucte = item.soluongyeucau; 
  }
};

const tongTienHang = computed(() => {
  return chiTietData.value.reduce((sum, item) => {
    const soLuong = Number(item.soluongthucte) || 0;
    const giaNhap = Number(item.gianhap) || 0;
    return sum + (soLuong * giaNhap);
  }, 0);
});

const tongTienThanhToan = computed(() => Math.max(0, tongTienHang.value - Number(masterForm.value.tienchietkhau)));

watch(tongTienThanhToan, (newVal) => {
  masterForm.value.tiendathanhtoan = newVal;
});

const tienNoNCC = computed(() => Math.max(0, tongTienThanhToan.value - Number(masterForm.value.tiendathanhtoan)));

// --- LƯU PHIẾU NHẬP ---
const handleSaveDonHang = async () => {
  if (!masterForm.value.madoitac || chiTietData.value.length === 0) {
    alert("Vui lòng chọn Nhà cung cấp và thêm mặt hàng!"); return;
  }
  
  // KIỂM TRA ĐỊNH DẠNG SỐ HÓA ĐƠN GTGT NẾU CÓ NHẬP
  const soHoaDon = (masterForm.value.sohoadongtgt || '').trim();
  if (soHoaDon && !/^\d{7}$/.test(soHoaDon)) {
    alert("LỖI: Số hóa đơn GTGT (nếu có) phải bao gồm ĐÚNG 7 CHỮ SỐ liên tiếp!");
    return;
  }

  if (chiTietData.value.some(item => !item.madonvitinh || !item.solo || !item.hansudung || !item.ngaysanxuat)) {
    alert("Vui lòng nhập đủ Đơn vị, Số Lô, Ngày sản xuất và Hạn sử dụng!"); return;
  }

  if (chiTietData.value.some(item => item.soluongthucte > item.soluongyeucau)) {
    alert("Lỗi: Tồn tại mặt hàng có số lượng thực nhận lớn hơn chứng từ!"); return;
  }

  const ngayNhap = new Date();
  const ngayNhapISO = new Date(ngayNhap.getFullYear(), ngayNhap.getMonth(), ngayNhap.getDate()).toISOString().split('T')[0];

  for (const item of chiTietData.value) {
    const thuoc: any = danhSachThuoc.value.find((t: any) => t.mathuoc === item.mathuoc);
    const sodangky = String(thuoc?.sodangky || '').toUpperCase();

    const hsd = new Date(item.hansudung);
    const nsx = new Date(item.ngaysanxuat);

    if (nsx >= hsd) {
      alert(`LỖI: Tại mặt hàng [${thuoc.tenthuoc}], Ngày sản xuất phải diễn ra TRƯỚC Hạn sử dụng!`);
      return;
    }
    if (hsd <= ngayNhap) {
      alert(`LỖI: Thuốc [${thuoc.tenthuoc}] đã hết hạn sử dụng. Không được phép nhập kho!`);
      return;
    }

    if (sodangky.startsWith('VN') || sodangky.startsWith('VNA')) {
      const thangTuoiTho = (hsd.getFullYear() - nsx.getFullYear()) * 12 + (hsd.getMonth() - nsx.getMonth());
      const thangTuNgaySanXuat = (ngayNhap.getFullYear() - nsx.getFullYear()) * 12 + (ngayNhap.getMonth() - nsx.getMonth());

      if (thangTuoiTho <= 36 && thangTuNgaySanXuat > 6) {
        alert(`LỖI GSP: Thuốc nhập khẩu [${thuoc.tenthuoc}] có tuổi thọ ${thangTuoiTho} tháng.\nQuy định: Không được nhập kho khi đã quá 6 tháng kể từ Ngày Sản Xuất (Lô này đã qua ${thangTuNgaySanXuat} tháng)!`);
        return;
      }
    }
  }

  try {
    isLoading.value = true;
    const donHangData = {
      madoitac: masterForm.value.madoitac,
      mataikhoan: authStore.user.mataikhoan,
      loaidonhang: 'nhap',
      sohoadongtgt: masterForm.value.sohoadongtgt,
      mavandon3pl: null,
      tonggiatri: tongTienThanhToan.value,
      tienchietkhau: masterForm.value.tienchietkhau,
      tiendathanhtoan: masterForm.value.tiendathanhtoan,
      trangthai: 'choduyet'
    };
    
    const resMaster: any = await api.post('/donhang', donHangData);
    const newDonHangId = resMaster.data.madonhang_moi;

    const promises = chiTietData.value.map(item => {
      return api.post('/chitietdonhang', {
        madonhang: newDonHangId,
        mathuoc: item.mathuoc,
        malo: null, 
        solo_tam: item.solo, 
        ngaysanxuat_tam: item.ngaysanxuat, 
        hansudung_tam: item.hansudung, 
        madonvitinh: item.madonvitinh,
        soluongyeucau: item.soluongyeucau,
        soluongthucte: item.soluongthucte,
        dongia: item.gianhap, 
        ngaynhap: ngayNhapISO
      });
    });

    await Promise.all(promises);
    alert('Tạo Phiếu Nhập thành công! Đang chờ Admin duyệt để cộng tồn kho.');
    closeForm();
    loadData();
  } catch (error: any) {
    alert("Lỗi khi lưu: " + error.message);
  } finally {
    isLoading.value = false;
  }
};

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(val) || 0);
const getLineTotal = (item: any) => (Number(item?.soluongthucte) || 0) * (Number(item?.dongia || item?.gianhap) || 0);
const tongTienHangChiTiet = computed(() => selectedDetails.value.reduce((sum, item) => sum + getLineTotal(item), 0));

onMounted(() => loadData());
</script>

<template>
  <div v-if="!showForm" class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Quản lý Nhập Kho (Mua hàng)</h2>
      <button @click="openForm" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition">
        📦 Tạo Phiếu Nhập
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-gray-600 text-sm border-b">
            <th class="p-4 font-semibold">Mã Phiếu</th>
            <th class="p-4 font-semibold">Nhà Cung Cấp</th>
            <th class="p-4 font-semibold">Tổng Tiền (Vốn)</th>
            <th class="p-4 font-semibold">Công Nợ NCC</th>
            <th class="p-4 font-semibold">Ngày Tạo</th>
            <th class="p-4 font-semibold">Trạng Thái</th>
            <th class="p-4 font-semibold text-center">Hành Động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="dh in danhSachDonHang" :key="dh.madonhang" class="border-b hover:bg-gray-50">
            <td class="p-4 font-bold text-gray-800">#{{ dh.madonhang }}</td>
            <td class="p-4 text-gray-700 font-medium">{{ dh.tendoitac }}</td>
            <td class="p-4 text-red-600 font-bold">{{ formatCurrency(dh.tonggiatri) }}</td>
            <td class="p-4 text-gray-500 font-medium">{{ formatCurrency(dh.tonggiatri - (dh.tiendathanhtoan || 0)) }}</td>
            <td class="p-4 text-gray-500 text-sm">{{ new Date(dh.ngaytao).toLocaleDateString('vi-VN') }}</td>
            <td class="p-4">
              <span v-if="dh.trangthai === 'choduyet'" class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded border border-yellow-200 text-xs font-bold">Biệt trữ (Chờ duyệt)</span>
              <span v-else-if="dh.trangthai === 'daduyet'" class="bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200 text-xs font-bold">Đã duyệt (Nhập kho)</span>
              <span v-else-if="dh.trangthai === 'huy'" class="bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200 text-xs font-bold">Đã hủy</span>
              <span v-else class="bg-gray-100 text-gray-500 px-2 py-1 rounded border border-gray-200 text-xs font-bold">{{ dh.trangthai }}</span>
            </td>
            <td class="p-4 flex gap-2 justify-center">
              <button @click="openDetail(dh)" class="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-bold rounded hover:bg-gray-200 transition">Chi tiết</button>
            </td>
          </tr>
          <tr v-if="danhSachDonHang.length === 0">
            <td colspan="7" class="p-8 text-center text-gray-500">Chưa có phiếu nhập kho nào.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showDetailModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div class="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h3 class="text-xl font-bold text-gray-800">
            Chi tiết Phiếu Nhập Kho <span class="text-purple-600">#{{ selectedMaster?.madonhang }}</span>
          </h3>
          <button @click="showDetailModal = false" class="text-gray-400 hover:text-red-500 font-bold text-2xl transition">&times;</button>
        </div>

        <div class="p-6 overflow-y-auto flex-1">
          <div class="grid grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <p class="text-xs text-gray-500 font-bold uppercase">Nhà cung cấp</p>
              <p class="font-medium text-gray-800">{{ selectedMaster?.tendoitac }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 font-bold uppercase">Người tạo phiếu</p>
              <p class="font-medium text-gray-800">{{ selectedMaster?.tendangnhap || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 font-bold uppercase">Thời gian tạo</p>
              <p class="font-medium text-gray-800">{{ new Date(selectedMaster?.ngaytao).toLocaleString('vi-VN') }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 font-bold uppercase">Trạng thái</p>
              <span v-if="selectedMaster?.trangthai === 'choduyet'" class="text-yellow-600 font-bold text-sm">⏳ Chờ duyệt</span>
              <span v-else-if="selectedMaster?.trangthai === 'daduyet'" class="text-green-600 font-bold text-sm">✅ Đã duyệt</span>
              <span v-else class="text-gray-500 font-bold text-sm">❌ Đã hủy</span>
            </div>
            <div>
              <p class="text-xs text-gray-500 font-bold uppercase">Hóa đơn GTGT</p>
              <p class="font-medium text-gray-800">{{ selectedMaster?.sohoadongtgt || 'Không có' }}</p>
            </div>
          </div>

          <h4 class="font-bold text-gray-700 uppercase text-sm mb-3 border-b pb-2">Danh sách Hàng hóa Nhập</h4>
          <div v-if="isLoadingDetail" class="py-10 text-center text-gray-500">Đang tải chi tiết hàng hóa...</div>
          <table v-else class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-100 text-[11px] text-gray-600 uppercase border-y">
                <th class="p-3 font-bold">Thuốc</th>
                <th class="p-3 font-bold">Số Lô</th>
                <th class="p-3 font-bold">HSD</th>
                <th class="p-3 font-bold text-center">SL CT</th>
                <th class="p-3 font-bold text-center text-blue-600">SL Nhận</th>
                <th class="p-3 font-bold text-right">Giá Vốn</th>
                <th class="p-3 font-bold text-right">Thành Tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ct, idx) in selectedDetails" :key="idx" class="border-b hover:bg-gray-50">
                <td class="p-3 font-medium text-gray-800 text-sm">{{ ct.tenthuoc }}</td>
                <td class="p-3 font-bold text-gray-600 text-sm">{{ ct.solo_tam || ct.malo || 'N/A' }}</td>
                <td class="p-3 text-sm" :class="new Date(ct.hansudung_tam || ct.hansudung) <= new Date() ? 'text-red-500 font-bold' : 'text-gray-600'">
                  {{ (ct.hansudung_tam || ct.hansudung) ? new Date(ct.hansudung_tam || ct.hansudung).toLocaleDateString('vi-VN') : 'N/A' }}
                </td>
                <td class="p-3 text-center text-sm">{{ ct.soluongyeucau }}</td>
                <td class="p-3 text-center font-bold text-blue-600 text-sm">{{ ct.soluongthucte }}</td>
                <td class="p-3 text-right text-sm">{{ formatCurrency(ct.dongia) }}</td>
                <td class="p-3 text-right font-bold text-red-600 text-sm">{{ formatCurrency(ct.soluongthucte * ct.dongia) }}</td>
              </tr>
              <tr v-if="selectedDetails.length === 0">
                <td colspan="7" class="p-6 text-center text-gray-500 italic">Không tìm thấy chi tiết của phiếu này.</td>
              </tr>
            </tbody>
          </table>

          <div class="mt-6 flex justify-end">
            <div class="w-72 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div class="flex justify-between mb-2 text-sm text-gray-600">
                <span>Tiền hàng:</span>
                <span>{{ formatCurrency(tongTienHangChiTiet) }}</span>
              </div>
              <div class="flex justify-between mb-2 text-sm text-orange-600">
                <span>Chiết khấu:</span>
                <span>- {{ formatCurrency(selectedMaster?.tienchietkhau || 0) }}</span>
              </div>
              <div class="flex justify-between mb-2 text-sm text-blue-600 font-bold border-t pt-2">
                <span>Cần thanh toán:</span>
                <span>{{ formatCurrency(selectedMaster?.tonggiatri || 0) }}</span>
              </div>
              <div class="flex justify-between mb-2 text-sm text-gray-600">
                <span>Đã trả NCC:</span>
                <span>- {{ formatCurrency(selectedMaster?.tiendathanhtoan || 0) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button @click="showDetailModal = false" class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition">Đóng</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="bg-gray-50 -m-6 p-6 min-h-screen">
    <div class="max-w-[1450px] mx-auto">
      
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-4">
          <button @click="closeForm" class="w-10 h-10 bg-white rounded-full shadow flex justify-center items-center text-gray-600 hover:bg-gray-100 font-bold text-xl transition">←</button>
          <h2 class="text-2xl font-bold text-gray-800">Tạo Phiếu Nhập Kho Mới</h2>
        </div>
        
        <div class="flex gap-4">
           <div class="flex gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-200">
              <div class="text-center px-4 border-r">
                <p class="text-[10px] text-gray-500 uppercase font-bold">Tổng Tiền Hàng</p>
                <p class="text-sm font-semibold text-gray-700">{{ formatCurrency(tongTienHang) }}</p>
              </div>
              <div class="text-center px-4 border-r">
                <p class="text-[10px] text-orange-500 uppercase font-bold">Chiết Khấu (Từ NCC)</p>
                <p class="text-sm font-semibold text-orange-600">- {{ formatCurrency(masterForm.tienchietkhau) }}</p>
              </div>
              <div class="text-center px-4">
                <p class="text-[10px] text-red-500 uppercase font-bold">Cần Thanh Toán</p>
                <p class="text-lg font-black text-red-600">{{ formatCurrency(tongTienThanhToan) }}</p>
              </div>
           </div>
           <button @click="handleSaveDonHang" :disabled="isLoading" class="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-xl font-bold shadow-md transition disabled:bg-gray-400">
             Lưu Phiếu & Trình Duyệt
           </button>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-3 bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-fit space-y-4">
          <h3 class="font-bold text-gray-700 border-b pb-2 uppercase text-sm">Thông tin Phiếu Nhập</h3>
          
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">CHỌN NHÀ CUNG CẤP (*)</label>
            <select v-model="masterForm.madoitac" class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500" required>
              <option value="" disabled>-- Chọn nhà cung cấp --</option>
              <option v-for="dt in danhSachNhaCungCap" :key="dt.madoitac" :value="dt.madoitac">{{ dt.tendoitac }}</option>
            </select>
            <div v-if="nhaCungCapDuocChon" class="mt-2 bg-blue-50 border border-blue-100 p-2 rounded text-[11px] text-gray-700">
              <p><b>Mã số thuế:</b> <span class="text-blue-700 font-black">{{ nhaCungCapDuocChon.masothue || 'Chưa cập nhật' }}</span></p>
              <p class="truncate" :title="nhaCungCapDuocChon.diachi"><b>Địa chỉ:</b> {{ nhaCungCapDuocChon.diachi || '---' }}</p>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">SỐ HÓA ĐƠN GTGT</label>
            <input v-model="masterForm.sohoadongtgt" type="text" maxlength="7" placeholder="Để đối chiếu thuế (7 số)..." class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          <div class="pt-4 border-t border-dashed space-y-3">
            <div class="flex justify-between items-center text-sm">
              <span class="text-gray-500 font-bold uppercase text-[10px]">Tiền hàng:</span>
              <span class="font-medium text-gray-800">{{ formatCurrency(tongTienHang) }}</span>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Chiết khấu từ NCC (VND):</label>
              <input v-model="masterForm.tienchietkhau" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-right font-bold text-orange-600 outline-none focus:ring-2 focus:ring-orange-400">
            </div>
            <div class="flex justify-between items-center pt-2 border-t text-red-600 mb-4 bg-red-50 px-2 py-3 rounded">
              <span class="font-bold text-sm">CẦN TRẢ NCC:</span>
              <span class="font-black text-xl">{{ formatCurrency(tongTienThanhToan) }}</span>
            </div>
            
            <div>
              <label class="block text-[10px] font-bold text-blue-600 mb-1 uppercase">TIỀN ĐÃ TRẢ NCC (VND)</label>
              <input v-model="masterForm.tiendathanhtoan" type="number" readonly class="w-full px-4 py-3 border-2 border-blue-400 bg-gray-100 text-blue-700 rounded-lg text-right font-black outline-none cursor-not-allowed transition">
            </div>
          </div>
        </div>

        <div class="col-span-9 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div class="flex justify-between items-center border-b pb-3 mb-4">
            <h3 class="font-bold text-gray-700 uppercase text-sm">Chi tiết hàng nhập (Vốn)</h3>
            <button @click="themDongChiTiet" type="button" class="text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-bold border border-blue-200 transition">
              + Thêm dòng
            </button>
          </div>

          <div class="overflow-x-auto min-h-[400px]">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[11px] text-gray-500 uppercase border-b bg-gray-50/80">
                  <th class="p-3 min-w-[200px] font-bold rounded-tl-lg">Tên Thuốc</th>
                  <th class="p-3 min-w-[140px] font-bold">ĐV Giao Dịch</th>
                  <th class="p-3 min-w-[150px] font-bold">Tạo Lô Mới / HSD</th>
                  <th class="p-3 min-w-[90px] text-center font-bold">SL CT</th>
                  <th class="p-3 min-w-[100px] text-center font-bold text-blue-600">SL Thực</th>
                  <th class="p-3 min-w-[150px] text-right font-bold">Giá Nhập (Vốn)</th>
                  <th class="p-3 min-w-[150px] text-right font-bold text-gray-700">Thành Tiền</th>
                  <th class="p-3 w-10 rounded-tr-lg"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in chiTietData" :key="index" class="border-b border-dashed hover:bg-gray-50 transition">
                  <td class="p-2 align-top">
                    <select v-model="item.mathuoc" @change="handleChonThuoc(item)" class="w-full px-2 py-2 border border-gray-300 rounded-md text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" required>
                      <option value="" disabled>-- Chọn thuốc --</option>
                      <option v-for="t in danhSachThuoc" :key="t.mathuoc" :value="t.mathuoc">{{ t.tenthuoc }}</option>
                    </select>
                  </td>
                  <td class="p-2 align-top">
                    <select v-model="item.madonvitinh" class="w-full px-2 py-2 border border-gray-300 rounded-md text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" :disabled="!item.mathuoc" required>
                      <option value="" disabled>-- ĐV --</option>
                      <option v-for="dv in getDonViTheoThuoc(item.mathuoc)" :key="dv.madonvitinh" :value="dv.madonvitinh">
                        {{ dv.tendonvi }} (x{{ dv.hesoquydoi }})
                      </option>
                    </select>
                  </td>
                  <td class="p-2 align-top flex flex-col gap-1.5">
                    <div class="relative">
                      <input v-model="item.solo" type="text" placeholder="Gõ số lô..." class="w-full px-2 py-2 pr-9 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" required>
                      <button type="button" title="Tạo mã tự động" @click="item.solo = generateLotNumber()" class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700 font-bold">⚡</button>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold text-gray-500 w-10">NSX:</span>
                        <input v-model="item.ngaysanxuat" type="date" class="w-full ml-1 px-1 py-1 border border-gray-300 rounded-md text-[11px] text-gray-600 outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" required>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold text-gray-500 w-10">HSD:</span>
                        <input v-model="item.hansudung" type="date" class="w-full ml-1 px-1 py-1 border border-gray-300 rounded-md text-[11px] text-gray-600 outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" required>
                    </div>
                  </td>
                  <td class="p-2 align-top">
                    <input v-model.number="item.soluongyeucau" @blur="validateSoLuong(item)" type="number" min="1" class="w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-center font-bold shadow-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                  </td>
                  <td class="p-2 align-top">
                    <input v-model.number="item.soluongthucte" @blur="validateSoLuong(item)" type="number" min="1" class="w-full px-2 py-2 border border-blue-300 rounded-md text-sm text-center font-black text-blue-700 bg-blue-50 focus:ring-2 focus:ring-blue-500 shadow-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                  </td>
                  <td class="p-2 align-top">
                    <input v-model.number="item.gianhap" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-right font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                  </td>
                  <td class="p-2 align-top text-right">
                    <span class="font-black text-gray-700 text-[15px] block pt-2">{{ formatCurrency(getLineTotal(item)) }}</span>
                  </td>
                  <td class="p-2 align-top text-center pt-3">
                    <button @click="xoaDong(index)" class="text-red-500 hover:text-red-700 font-bold text-2xl transition" title="Xóa dòng này">×</button>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div v-if="chiTietData.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400 border-b border-dashed">
              <p class="text-sm">Chưa có hàng hóa nào trong phiếu nhập.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>