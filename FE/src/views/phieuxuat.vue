<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const danhSachDonHang = ref([]);
const danhSachKhachHang = ref([]);
const danhSachThuoc = ref([]);
const danhSachDonVi = ref([]);
const danhSachLo = ref([]); 

const isLoading = ref(false);
const showForm = ref(false);
const showDetailModal = ref(false);
const selectedDonHang = ref<any>(null);
const chiTietDonHang = ref<any[]>([]);
const isLoadingDetail = ref(false);

const masterForm = ref({
  madoitac: '',
  mavandon3pl: '', 
  ghi_chu: '',
  tienchietkhau: 0,
  tiendathanhtoan: 0 
});

const chiTietData = ref<any[]>([]);

const loadData = async () => {
  isLoading.value = true;
  try {
    const [resDH, resDT, resThuoc, resDV, resLo]: any = await Promise.all([
      api.get('/donhang/loai/xuat'), 
      api.get('/doitac/loai/KhachHang'), 
      api.get('/thuoc'),
      api.get('/donvitinh'),
      api.get('/lothuoc')
    ]);
    danhSachDonHang.value = resDH.data;
    danhSachKhachHang.value = resDT.data.filter((dt: any) => dt.trangthai === 'Dang hop tac');
    danhSachThuoc.value = resThuoc.data.filter((t: any) => Number(t.trangthai) === 1);
    danhSachDonVi.value = resDV.data;
    danhSachLo.value = resLo.data.filter((lo: any) => String(lo.trangthai || '').toLowerCase() === 'sansangban');
  } catch (error) {
    console.error('Lỗi tải dữ liệu:', error);
  } finally {
    isLoading.value = false;
  }
};

const openForm = () => {
  masterForm.value = { madoitac: '', mavandon3pl: '', ghi_chu: '', tienchietkhau: 0, tiendathanhtoan: 0 };
  chiTietData.value = [];
  showForm.value = true;
};

const closeForm = () => showForm.value = false;

const themDongChiTiet = () => {
  chiTietData.value.push({ 
    mathuoc: '', madonvitinh: '', malo: '', 
    soluongthucte: 1, gianhap: 0, phantramlai: 10, dongia: 0 
  });
};

const xoaDong = (index: number) => chiTietData.value.splice(index, 1);

const getDonViTheoThuoc = (mathuoc: any) => danhSachDonVi.value.filter((dv: any) => dv.mathuoc === mathuoc);
const getLoTheoThuoc = (mathuoc: any) => danhSachLo.value.filter((lo: any) => lo.mathuoc === mathuoc && lo.tonkhadung > 0 && String(lo.trangthai || '').toLowerCase() === 'sansangban');
const danhSachThuocCoTheXuat = computed(() => {
  const availableSet = new Set(danhSachLo.value
    .filter((lo: any) => lo.tonkhadung > 0 && String(lo.trangthai || '').toLowerCase() === 'sansangban')
    .map((lo: any) => lo.mathuoc));
  return danhSachThuoc.value.filter((t: any) => availableSet.has(t.mathuoc));
});
const getThuocOptionsForRow = (currentItem: any) => {
  const selectedSet = new Set(
    chiTietData.value
      .filter((row: any) => row !== currentItem && row.mathuoc)
      .map((row: any) => row.mathuoc)
  );
  return danhSachThuocCoTheXuat.value.filter((t: any) => !selectedSet.has(t.mathuoc));
};

const generateTrackingId = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  const base = `VNPOST-${yyyy}${mm}${dd}-${randomPart}`;
  const existed = danhSachDonHang.value.some((d: any) => String(d.mavandon3pl || '').toUpperCase() === base);
  return existed ? `${base}-${Math.floor(Math.random() * 9)}` : base;
};

const handleAutoTracking = () => {
  masterForm.value.mavandon3pl = generateTrackingId();
};

// --- LOGIC XUẤT KHO ---
const handleChonThuoc = (item: any) => {
  item.madonvitinh = '';
  item.malo = '';
  item.soluongthucte = 1;
  item.gianhap = 0;
  item.dongia = 0;
};

const handleChonLoHoacDonVi = (item: any) => {
  item.soluongthucte = 1; 

  let giaGocCoBan = 0;
  if (item.malo) {
    const lo: any = danhSachLo.value.find((l: any) => l.malo === item.malo);
    giaGocCoBan = lo ? (Number(lo.gianhapgannhat) || Number(lo.gianhap) || 0) : 0;
  }

  let heSo = 1;
  if (item.madonvitinh) {
    const dv: any = danhSachDonVi.value.find((d: any) => d.madonvitinh === item.madonvitinh);
    heSo = dv ? Number(dv.hesoquydoi) : 1;
  }

  item.gianhap = giaGocCoBan * heSo;
  tinhDonGiaBan(item);
};

const tinhDonGiaBan = (item: any) => {
  item.dongia = Number(item.gianhap) * (1 + Number(item.phantramlai) / 100);
};

const getMaxQty = (item: any) => {
  if (!item.malo || !item.madonvitinh) return 0;
  const lo: any = danhSachLo.value.find((l: any) => l.malo === item.malo);
  const dv: any = danhSachDonVi.value.find((d: any) => d.madonvitinh === item.madonvitinh);
  if (!lo || !dv) return 0;
  return Math.floor(lo.tonkhadung / dv.hesoquydoi);
};

const kiemTraSoLuong = (item: any) => {
  let val = parseInt(item.soluongthucte);
  if (isNaN(val) || val < 1) {
    item.soluongthucte = 1;
    return;
  }
  const max = getMaxQty(item);
  if (max > 0 && val > max) {
    item.soluongthucte = max;
  } else {
    item.soluongthucte = val;
  }
};

// --- COMPUTED BUSINESS LOGIC ---

const khachHangDuocChon = computed(() => {
  if (!masterForm.value.madoitac) return null;
  return danhSachKhachHang.value.find((k: any) => k.madoitac === masterForm.value.madoitac) || null;
});

const tongTienNhap = computed(() => chiTietData.value.reduce((sum, item) => sum + (Number(item.soluongthucte) * Number(item.gianhap)), 0));
const tongTienLai = computed(() => chiTietData.value.reduce((sum, item) => {
  const laiMoiDonVi = Number(item.gianhap) * (Number(item.phantramlai) / 100);
  return sum + (Number(item.soluongthucte) * laiMoiDonVi);
}, 0));
const tongTienHang = computed(() => tongTienNhap.value + tongTienLai.value);

// Logic Hạng Thành Viên
const mucChietKhau = computed(() => {
  const kh = khachHangDuocChon.value;
  if (!kh) return { phanTram: 0, tenHang: 'Khách Mới' };
  
  if (kh.solangiaodich_thanhcong >= 10) return { phanTram: 5, tenHang: 'Khách VIP' };
  if (kh.solangiaodich_thanhcong >= 5) return { phanTram: 2, tenHang: 'Khách Thân Thiết' };
  return { phanTram: 0, tenHang: 'Khách Thường' };
});

watch([tongTienHang, khachHangDuocChon], () => {
  if (mucChietKhau.value.phanTram > 0) {
    masterForm.value.tienchietkhau = (tongTienHang.value * mucChietKhau.value.phanTram) / 100;
  } else {
    masterForm.value.tienchietkhau = 0;
  }
});

const tongGiaTriDon = computed(() => Math.max(0, tongTienHang.value - Number(masterForm.value.tienchietkhau)));
const tienConNo = computed(() => Math.max(0, tongGiaTriDon.value - Number(masterForm.value.tiendathanhtoan)));

const tongNoDuKien = computed(() => {
  if (!khachHangDuocChon.value) return 0;
  return Number(khachHangDuocChon.value.tongnohientai) + tienConNo.value;
});

const isVuotHanMuc = computed(() => {
  const kh = khachHangDuocChon.value;
  if (!kh || kh.hanmucno == 0) return false; 
  return tongNoDuKien.value > kh.hanmucno;
});

const canhBaoLanh = computed(() => {
  return chiTietData.value.some(item => {
    if (!item.mathuoc) return false;
    const thuoc: any = danhSachThuoc.value.find((t: any) => t.mathuoc === item.mathuoc);
    return thuoc && thuoc.dieukienbaoquan && thuoc.dieukienbaoquan.toLowerCase().includes('2°c - 8°c');
  });
});

const handleSaveDonHang = async () => {
  if (!masterForm.value.madoitac || chiTietData.value.length === 0) {
    alert("Vui lòng chọn khách hàng và thêm mặt hàng!"); return;
  }

  if (!masterForm.value.mavandon3pl || String(masterForm.value.mavandon3pl).trim() === '') {
    alert('Vui lòng nhập hoặc tự tạo Mã vận đơn!');
    return;
  }
  
  if (isVuotHanMuc.value) {
    const xacNhan = confirm("CẢNH BÁO: Khách hàng đã vượt hạn mức công nợ! Bạn có chắc chắn muốn lưu đơn để trình Admin duyệt không?");
    if (!xacNhan) return;
  }

  try {
    isLoading.value = true;
    const donHangData = {
      madoitac: masterForm.value.madoitac,
      mataikhoan: authStore.user.mataikhoan,
      loaidonhang: 'xuat',
      mavandon3pl: masterForm.value.mavandon3pl,
      tonggiatri: tongGiaTriDon.value, 
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
        malo: item.malo,
        madonvitinh: item.madonvitinh,
        soluongyeucau: item.soluongthucte, 
        soluongthucte: item.soluongthucte,
        dongia: item.dongia 
      });
    });
    await Promise.all(promises);
    alert('Tạo Đơn Bán Hàng thành công!');
    closeForm();
    loadData();
  } catch (error: any) {
    alert("Lỗi khi lưu: " + error.message);
  } finally {
    isLoading.value = false;
  }
};

const openDetailModal = async (donHang: any) => {
  selectedDonHang.value = donHang;
  showDetailModal.value = true;
  isLoadingDetail.value = true;
  try {
    const res: any = await api.get(`/chitietdonhang/donhang/${donHang.madonhang}`);
    chiTietDonHang.value = res.data || [];
  } catch (error) {
    console.error('Lỗi tải chi tiết đơn hàng:', error);
  } finally {
    isLoadingDetail.value = false;
  }
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedDonHang.value = null;
  chiTietDonHang.value = [];
};

const tongTienHangModal = computed(() => chiTietDonHang.value.reduce((sum, item) => sum + (Number(item.soluongthucte) * Number(item.dongia)), 0));
const chietKhauModal = computed(() => Number(selectedDonHang.value?.tienchietkhau || 0));
const khachCanTraModal = computed(() => Math.max(0, tongTienHangModal.value - chietKhauModal.value));
const vietQrUrl = computed(() => {
  if (!selectedDonHang.value) return '';
  const amount = Math.round(khachCanTraModal.value || 0);
  const addInfo = `Thanh toan don hang XUAT${selectedDonHang.value.madonhang}`;
  const base = 'https://api.vietqr.io/image/970436-1042328265-wp5fFpl.jpg?accountName=TRAN%20TUAN%20DAT';
  return `${base}&amount=${amount}&addInfo=${encodeURIComponent(addInfo)}`;
});

const handlePrint = () => {
  window.print();
};

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('vi-VN');
onMounted(() => loadData());
</script>

<template>
  <div v-if="!showForm" class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Quản lý Xuất Kho (Bán sỉ)</h2>
      <button @click="openForm" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition">🚚 Tạo Đơn Xuất</button>
    </div>
    <div v-if="isLoading" class="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-gray-600 text-sm border-b">
            <th class="p-4 font-semibold">Mã ĐH</th>
            <th class="p-4 font-semibold">Khách Hàng</th>
            <th class="p-4 font-semibold">Phải Thu</th>
            <th class="p-4 font-semibold">Công Nợ Khách</th>
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
            <td class="p-4 text-gray-500 text-sm">{{ formatDate(dh.ngaytao) }}</td>
            <td class="p-4">
              <span v-if="dh.trangthai === 'choduyet'" class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded border text-xs font-bold">Chờ duyệt xuất</span>
              <span v-else class="bg-blue-100 text-blue-700 px-2 py-1 rounded border text-xs font-bold">Đã xuất kho</span>
            </td>
            <td class="p-4 flex gap-2 justify-center">
              <button @click="openDetailModal(dh)" class="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200">Chi tiết</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div v-else class="bg-gray-50 -m-6 p-6 min-h-screen">
    <div class="max-w-[1450px] mx-auto">
      
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center gap-4">
          <button @click="closeForm" class="w-10 h-10 bg-white rounded-full shadow flex justify-center items-center text-gray-600 hover:bg-gray-100 font-bold text-xl transition">←</button>
          <h2 class="text-2xl font-bold text-gray-800">Lập Đơn Bán Hàng</h2>
        </div>
        <div class="flex gap-4">
           <div class="flex gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-200">
              <div class="text-center px-4 border-r">
                <p class="text-[10px] text-gray-500 uppercase font-bold">Vốn</p>
                <p class="text-sm font-semibold text-gray-700">{{ formatCurrency(tongTienNhap) }}</p>
              </div>
              <div class="text-center px-4 border-r">
                <p class="text-[10px] text-blue-500 uppercase font-bold">Lãi</p>
                <p class="text-sm font-semibold text-blue-600">+ {{ formatCurrency(tongTienLai) }}</p>
              </div>
              <div class="text-center px-4">
                <p class="text-[10px] text-red-500 uppercase font-bold">Tổng Cộng</p>
                <p class="text-lg font-black text-red-600">{{ formatCurrency(tongGiaTriDon) }}</p>
              </div>
           </div>
           <button @click="handleSaveDonHang" :disabled="isLoading" class="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-xl font-bold shadow-md transition disabled:bg-gray-400">Lưu Đơn</button>
        </div>
      </div>

      <div v-if="canhBaoLanh" class="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-800 font-medium rounded-lg flex items-center gap-3">
        <span class="text-xl">❄️</span> <strong>BẢO QUẢN LẠNH:</strong> Chú ý xuất kèm thùng xốp và đá gel!
      </div>

      <div class="grid grid-cols-12 gap-6">
        <div class="col-span-3 bg-white p-5 rounded-xl shadow-sm border border-gray-200 h-fit space-y-4">
          <h3 class="font-bold text-gray-700 border-b pb-2 uppercase text-sm">Thông tin</h3>
          
          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">KHÁCH HÀNG (*)</label>
            <select v-model="masterForm.madoitac" class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm outline-none" required>
              <option value="" disabled>-- Chọn --</option>
              <option v-for="dt in danhSachKhachHang" :key="dt.madoitac" :value="dt.madoitac">{{ dt.tendoitac }}</option>
            </select>
          </div>

          <div v-if="khachHangDuocChon" class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-[12px] space-y-1.5">
            <div class="flex justify-between items-center border-b border-dashed pb-1 mb-1">
              <span class="text-gray-500 font-medium">Hạng thành viên:</span>
              <span class="font-bold px-2 py-0.5 rounded text-white" :class="mucChietKhau.phanTram > 0 ? 'bg-orange-500' : 'bg-gray-400'">
                {{ mucChietKhau.tenHang }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Hạn mức nợ:</span>
              <span class="font-bold">{{ khachHangDuocChon.hanmucno > 0 ? formatCurrency(khachHangDuocChon.hanmucno) : 'Không giới hạn' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Nợ cũ:</span>
              <span class="font-bold text-red-500">{{ formatCurrency(khachHangDuocChon.tongnohientai) }}</span>
            </div>
            <div class="flex justify-between pt-1 border-t border-gray-200 mt-1">
              <span class="text-gray-700 font-bold">Nợ sau đơn này:</span>
              <span class="font-black" :class="isVuotHanMuc ? 'text-red-600' : 'text-blue-600'">{{ formatCurrency(tongNoDuKien) }}</span>
            </div>
            <div v-if="isVuotHanMuc" class="mt-1 text-[10px] text-red-600 font-bold bg-red-100 p-1 rounded text-center">
              ⚠️ VƯỢT HẠN MỨC NỢ
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-500 mb-1">TRACKING ID (*)</label>
            <div class="flex gap-2">
              <input v-model="masterForm.mavandon3pl" type="text" placeholder="VNPOST-YYYYMMDD-XXXX" class="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none">
              <button type="button" @click="handleAutoTracking" class="px-3 py-2 rounded-lg bg-yellow-500 text-white font-bold shadow hover:bg-yellow-600">⚡</button>
            </div>
          </div>

          <div class="pt-4 border-t border-dashed space-y-3">
             <div class="flex justify-between items-center text-sm">
                <span class="text-gray-500 font-bold uppercase text-[10px]">Tiền hàng:</span>
                <span class="font-medium text-gray-800">{{ formatCurrency(tongTienHang) }}</span>
             </div>
             <div>
                <div class="flex justify-between items-center mb-1">
                   <label class="text-[10px] font-bold text-gray-500 uppercase">Chiết khấu (VND):</label>
                   <span v-if="mucChietKhau.phanTram > 0" class="text-[10px] text-orange-600 font-bold">(-{{ mucChietKhau.phanTram }}%)</span>
                </div>
                <input v-model="masterForm.tienchietkhau" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-right font-bold text-orange-600 outline-none">
             </div>
             <div class="flex justify-between items-center pt-2 border-t text-red-600">
                <span class="font-bold text-sm">KHÁCH PHẢI TRẢ:</span>
                <span class="font-black text-xl">{{ formatCurrency(tongGiaTriDon) }}</span>
             </div>
             
             <div>
                <label class="block text-[10px] font-bold text-blue-600 mb-1 uppercase">Đã thanh toán (VND):</label>
                <input v-model="masterForm.tiendathanhtoan" type="number" min="0" class="w-full px-3 py-2 border-2 border-blue-300 bg-blue-50 text-blue-700 rounded-lg text-right font-bold outline-none focus:ring-2 focus:ring-blue-500">
             </div>

             <div class="flex justify-between items-center text-sm bg-gray-100 p-2 rounded-lg border border-gray-200">
                <span class="text-gray-600 font-bold text-[11px] uppercase">Nợ đơn này:</span>
                <span class="font-black text-gray-800">{{ formatCurrency(tienConNo) }}</span>
             </div>
          </div>
        </div>

        <div class="col-span-9 bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div class="flex justify-between items-center border-b pb-3 mb-4">
            <h3 class="font-bold text-gray-700 uppercase text-sm">Giỏ hàng xuất</h3>
            <button @click="themDongChiTiet" type="button" class="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-bold border border-blue-200 transition">+ Thêm Thuốc</button>
          </div>

          <div class="overflow-x-auto min-h-[400px]">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[11px] text-gray-500 uppercase border-b bg-gray-50">
                  <th class="p-3 min-w-[200px] font-bold">Tên Thuốc</th>
                  <th class="p-3 min-w-[220px] font-bold">Lô & HSD</th>
                  <th class="p-3 min-w-[150px] font-bold">ĐV Quy Đổi</th>
                  <th class="p-3 min-w-[120px] text-center font-bold text-blue-600">SL Xuất</th>
                  <th class="p-3 min-w-[150px] text-right font-bold">Giá Vốn</th>
                  <th class="p-3 min-w-[100px] text-center font-bold">% Lãi</th>
                  <th class="p-3 min-w-[150px] text-right text-red-600 font-bold">Đơn Giá</th>
                  <th class="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in chiTietData" :key="index" class="border-b border-dashed hover:bg-gray-50">
                  <td class="p-2 align-top">
                    <select v-model="item.mathuoc" @change="handleChonThuoc(item)" class="w-full px-2 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" required>
                      <option value="" disabled>-- Thuốc --</option>
                      <option v-for="t in getThuocOptionsForRow(item)" :key="t.mathuoc" :value="t.mathuoc">{{ t.tenthuoc }}</option>
                    </select>
                  </td>
                  <td class="p-2 align-top">
                    <select v-model="item.malo" @change="handleChonLoHoacDonVi(item)" class="w-full px-2 py-2 border border-gray-300 rounded-md text-xs outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" :disabled="!item.mathuoc" required>
                      <option value="" disabled>- Lô -</option>
                      <option v-for="lo in getLoTheoThuoc(item.mathuoc)" :key="lo.malo" :value="lo.malo">{{ lo.solo }} (HSD: {{ formatDate(lo.hansudung) }})</option>
                    </select>
                  </td>
                  <td class="p-2 align-top">
                    <select v-model="item.madonvitinh" @change="handleChonLoHoacDonVi(item)" class="w-full px-2 py-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 shadow-sm" :disabled="!item.mathuoc" required>
                      <option value="" disabled>-- ĐV --</option>
                      <option v-for="dv in getDonViTheoThuoc(item.mathuoc)" :key="dv.madonvitinh" :value="dv.madonvitinh">{{ dv.tendonvi }} (x{{ dv.hesoquydoi }})</option>
                    </select>
                  </td>
                  <td class="p-2 align-top">
                    <div class="flex flex-col items-center">
                       <input 
                        v-model.number="item.soluongthucte" 
                        type="number" 
                        @blur="kiemTraSoLuong(item)"
                        :disabled="!item.malo || !item.madonvitinh"
                        class="w-full px-4 py-2 border rounded-md text-sm text-center font-black shadow-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        :class="(!item.malo || !item.madonvitinh) ? 'bg-gray-100 text-gray-300' : 'bg-blue-50 text-blue-800 border-blue-300 focus:ring-2 focus:ring-blue-500'"
                      >
                      <div v-if="item.malo" class="text-[10px] mt-1 font-bold" :class="item.soluongthucte > getMaxQty(item) ? 'text-red-600' : 'text-gray-400'">Tối đa: {{ getMaxQty(item) }}</div>
                    </div>
                  </td>
                  <td class="p-2 align-top">
                    <div class="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-800 text-sm text-right font-black shadow-inner">
                      {{ formatCurrency(item.gianhap) }}
                    </div>
                  </td>
                  <td class="p-2 align-top">
                    <div class="relative">
                      <input v-model="item.phantramlai" type="number" @input="tinhDonGiaBan(item)" class="w-full px-2 py-2 border border-gray-300 rounded-md text-sm text-center font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none">
                      <span class="absolute right-1 top-2.5 text-[10px] font-bold text-gray-400">%</span>
                    </div>
                  </td>
                  <td class="p-2 text-right align-top">
                    <span class="font-black text-red-600 text-md block pt-1">{{ formatCurrency(item.dongia) }}</span>
                  </td>
                  <td class="p-2 text-center align-top pt-3">
                    <button @click="xoaDong(index)" class="text-gray-400 hover:text-red-500 font-bold text-xl transition">×</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showDetailModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div class="print-area w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-gray-200">
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h3 class="text-xl font-bold text-gray-800">Chi tiết Phiếu Xuất</h3>
          <p v-if="selectedDonHang" class="text-xs text-gray-500">Mã đơn: #{{ selectedDonHang.madonhang }} · {{ formatDate(selectedDonHang.ngaytao) }}</p>
        </div>
        <button @click="closeDetailModal" class="print-hidden w-9 h-9 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200">×</button>
      </div>

      <div class="p-6 space-y-6">
        <div class="grid grid-cols-12 gap-6">
          <div class="col-span-8">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-bold text-gray-700 uppercase text-sm">Danh sách hàng hóa</h4>
              <span class="text-xs text-gray-400">Đơn xuất kho</span>
            </div>
            <div class="overflow-x-auto border rounded-xl">
              <table class="w-full text-left text-sm">
                <thead>
                  <tr class="bg-gray-50 text-gray-500 uppercase text-[11px]">
                    <th class="p-3 font-bold">Thuốc</th>
                    <th class="p-3 font-bold">Số lượng</th>
                    <th class="p-3 font-bold">Đơn giá</th>
                    <th class="p-3 font-bold text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="isLoadingDetail">
                    <td colspan="4" class="p-4 text-center text-gray-400">Đang tải chi tiết...</td>
                  </tr>
                  <tr v-else v-for="ct in chiTietDonHang" :key="ct.mactdh" class="border-t">
                    <td class="p-3 font-medium text-gray-700">{{ ct.tenthuoc || ct.mathuoc }}</td>
                    <td class="p-3">{{ ct.soluongthucte }}</td>
                    <td class="p-3 text-gray-600">{{ formatCurrency(ct.dongia) }}</td>
                    <td class="p-3 text-right font-semibold text-gray-800">{{ formatCurrency(ct.soluongthucte * ct.dongia) }}</td>
                  </tr>
                  <tr v-if="!isLoadingDetail && chiTietDonHang.length === 0">
                    <td colspan="4" class="p-4 text-center text-gray-400">Không có dữ liệu.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="col-span-4 space-y-4">
            <div class="border rounded-xl p-4 bg-gray-50">
              <h4 class="font-bold text-gray-700 uppercase text-xs mb-3">Tổng kết tài chính</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Tổng tiền hàng</span>
                  <span class="font-semibold text-gray-800">{{ formatCurrency(tongTienHangModal) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Chiết khấu</span>
                  <span class="font-semibold text-orange-600">- {{ formatCurrency(chietKhauModal) }}</span>
                </div>
                <div class="flex justify-between border-t pt-2">
                  <span class="font-bold text-gray-700">Khách cần trả</span>
                  <span class="font-black text-red-600">{{ formatCurrency(khachCanTraModal) }}</span>
                </div>
              </div>
            </div>

            <div class="border rounded-xl p-4 bg-white">
              <h4 class="font-bold text-gray-700 uppercase text-xs mb-3">VietQR thanh toán</h4>
              <div class="flex flex-col items-center gap-3">
                <img v-if="vietQrUrl" :src="vietQrUrl" alt="VietQR" class="w-48 h-48 rounded-lg border" />
                <p v-if="selectedDonHang" class="text-[11px] text-gray-500 text-center">Nội dung chuyển khoản: <strong>Thanh toan don hang XUAT{{ selectedDonHang.madonhang }}</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="print-hidden flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
        <button @click="closeDetailModal" class="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Đóng</button>
        <button @click="handlePrint" class="px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700">Xuất PDF / In Đơn</button>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  .print-area, .print-area * {
    visibility: visible;
  }
  .print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    box-shadow: none !important;
    border: none !important;
  }
  .print-hidden {
    display: none !important;
  }
}
</style>