<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';

const danhSachTong = ref<any[]>([]);
const danhSachDonVi = ref<any[]>([]);
const isLoading = ref(false);
const filterLoai = ref('all'); // all | nhap | xuat | kiemke

const showDetailModal = ref(false);
const selectedMaster = ref<any | null>(null);
const selectedDetails = ref<any[]>([]);
const isLoadingDetail = ref(false);

const loadData = async () => {
  isLoading.value = true;
  try {
    // Kéo cả Đơn hàng (Nhập/Xuất) và Phiếu kiểm kê cùng lúc
    const [resDH, resPKK, resDV]: any = await Promise.all([
      api.get('/donhang'),
      api.get('/phieukiemke'),
      api.get('/donvitinh')
    ]);

    danhSachDonVi.value = resDV.data || [];

    // CHỈ LỌC NHỮNG ĐƠN HÀNG ĐANG CHỜ DUYỆT
    const dhChoDuyet = resDH.data.filter((dh: any) => dh.trangthai === 'choduyet');

    // CHỈ LỌC NHỮNG PHIẾU KIỂM KÊ ĐANG CHỜ DUYỆT
    const pkkChoDuyet = resPKK.data
      .filter((p: any) => p.trangthai === 'dangkhiemke' || p.trangthai === 'Draft')
      .map((p: any) => ({
        madonhang: p.maphieu,
        loaidonhang: 'kiemke',
        tendoitac: p.nguoitao, // Với kiểm kê, hiển thị người tạo
        tonggiatri: 0, 
        ngaytao: p.ngaykiemke,
        trangthai: 'choduyet'
      }));

    // Gộp chung 2 mảng chờ duyệt và sắp xếp (cũ nhất ở trên cùng để duyệt trước)
    danhSachTong.value = [...dhChoDuyet, ...pkkChoDuyet].sort((a, b) => 
      new Date(a.ngaytao).getTime() - new Date(b.ngaytao).getTime()
    );
  } catch (error) {
    console.error('Lỗi tải dữ liệu kiểm duyệt:', error);
  } finally {
    isLoading.value = false;
  }
};

// Lọc theo Loại (Tất cả / Nhập / Xuất / Kiểm kê)
const filteredDanhSach = computed(() => {
  if (filterLoai.value === 'all') return danhSachTong.value;
  return danhSachTong.value.filter(item => item.loaidonhang === filterLoai.value);
});

// Xử lý duyệt Đơn hàng (Nhập/Xuất)
const handleDuyetDonHang = async (id: number, loai: string) => {
  const tenLoai = loai === 'nhap' ? 'Phiếu Nhập' : 'Đơn Xuất';
  if (!confirm(`Xác nhận DUYỆT ${tenLoai} #${id}? Kho và công nợ sẽ được cập nhật tự động.`)) return;
  try {
    await api.put(`/donhang/${id}/trangthai`, { trangthai: 'daduyet' });
    alert(`Đã duyệt thành công!`);
    loadData(); // Tải lại dữ liệu, đơn đã duyệt sẽ tự biến mất khỏi danh sách
  } catch (error: any) { 
    alert("Lỗi khi duyệt đơn: " + (error.response?.data?.message || error.message || "Lỗi hệ thống")); 
  }
};

// Xử lý Hủy / Từ chối đơn hàng (Cộng lại tồn khả dụng)
const handleHuyDonHang = async (id: number) => {
  if (!confirm(`Bạn có chắc chắn muốn TỪ CHỐI / HỦY đơn #${id} này?`)) return;
  try {
    await api.put(`/donhang/${id}/trangthai`, { trangthai: 'huy' });
    alert(`Đã từ chối đơn hàng!`);
    loadData();
  } catch (error: any) { 
    alert("Lỗi khi hủy đơn: " + (error.response?.data?.message || "Lỗi hệ thống")); 
  }
};

// Xử lý duyệt Phiếu Kiểm Kê
const handleDuyetKiemKe = async (maphieu: string) => {
  if (!confirm(`Xác nhận duyệt kết quả kiểm kê ${maphieu}? Tồn kho thực tế sẽ được bù trừ ngay lập tức.`)) return;
  try {
    await api.put(`/phieukiemke/${maphieu}/trangthai`, { trangthai: 'hoanthanh' });
    alert(`Đã hoàn tất kiểm kê và cập nhật kho!`);
    loadData();
  } catch (error: any) { 
    alert("Lỗi khi duyệt phiếu kiểm kê: " + (error.response?.data?.message || "Lỗi hệ thống")); 
  }
};

// # Thêm hàm xử lý từ chối phiếu kiểm kê #
const handleHuyKiemKe = async (maphieu: string) => {
  if (!confirm(`Bạn có chắc chắn muốn TỪ CHỐI phiếu kiểm kê ${maphieu} này?`)) return;
  try {
    await api.put(`/phieukiemke/${maphieu}/trangthai`, { trangthai: 'huy' });
    alert(`Đã từ chối phiếu kiểm kê!`);
    loadData();
  } catch (error: any) { 
    alert("Lỗi khi từ chối phiếu kiểm kê: " + (error.response?.data?.message || "Lỗi hệ thống")); 
  }
};

const normalizeMaster = (data: any) => (Array.isArray(data) ? data[0] : data);

const openDetail = async (item: any) => {
  isLoadingDetail.value = true;
  selectedMaster.value = null;
  selectedDetails.value = [];
  showDetailModal.value = true;

  try {
    if (item.loaidonhang === 'kiemke') {
      const [resMaster, resDetails]: any = await Promise.all([
        api.get(`/phieukiemke/${item.madonhang}`),
        api.get(`/chitietkiemke/phieu/${item.madonhang}`)
      ]);

      const master = normalizeMaster(resMaster.data) || {};
      selectedMaster.value = { ...master, loaidonhang: 'kiemke' };
      selectedDetails.value = resDetails.data || [];
    } else {
      const [resMaster, resDetails]: any = await Promise.all([
        api.get(`/donhang/${item.madonhang}`),
        api.get(`/chitietdonhang/donhang/${item.madonhang}`)
      ]);

      const master = normalizeMaster(resMaster.data) || {};
      selectedMaster.value = { ...master, loaidonhang: item.loaidonhang };
      selectedDetails.value = resDetails.data || [];
    }
  } catch (error: any) {
    alert("Lỗi khi tải chi tiết: " + (error.response?.data?.message || error.message || "Lỗi hệ thống"));
  } finally {
    isLoadingDetail.value = false;
  }
};

const closeDetail = () => {
  showDetailModal.value = false;
  selectedMaster.value = null;
  selectedDetails.value = [];
};

const isKiemKeSelected = computed(() => selectedMaster.value?.loaidonhang === 'kiemke');

const getTenDonVi = (row: any) => {
  if (row?.tendonvi || row?.donvi) return row.tendonvi || row.donvi;
  const ma = row?.madonvitinh;
  if (!ma) return '---';
  const dv = danhSachDonVi.value.find((d: any) => d.madonvitinh === ma);
  return dv?.tendonvi || ma || '---';
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

const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

onMounted(() => loadData());
</script>

<template>
  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-screen">
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center gap-3">
        <h2 class="text-2xl font-bold text-gray-800">Trung Tâm Kiểm Duyệt</h2>
        <span class="bg-red-100 text-red-600 font-bold px-3 py-1 rounded-full text-sm">
          {{ danhSachTong.length }} Yêu cầu
        </span>
      </div>
      
      <div class="flex bg-gray-100 p-1 rounded-lg border">
        <button @click="filterLoai = 'all'" :class="filterLoai === 'all' ? 'bg-white shadow text-gray-800' : 'text-gray-500'" class="px-4 py-1.5 rounded-md text-xs font-bold transition">Tất cả</button>
        <button @click="filterLoai = 'nhap'" :class="filterLoai === 'nhap' ? 'bg-white shadow text-purple-600' : 'text-gray-500'" class="px-4 py-1.5 rounded-md text-xs font-bold transition">Nhập kho</button>
        <button @click="filterLoai = 'xuat'" :class="filterLoai === 'xuat' ? 'bg-white shadow text-blue-600' : 'text-gray-500'" class="px-4 py-1.5 rounded-md text-xs font-bold transition">Xuất kho</button>
        <button @click="filterLoai = 'kiemke'" :class="filterLoai === 'kiemke' ? 'bg-white shadow text-orange-600' : 'text-gray-500'" class="px-4 py-1.5 rounded-md text-xs font-bold transition">Kiểm kê</button>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-10 text-gray-500">Đang tải danh sách chờ duyệt...</div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-gray-600 text-sm border-b">
            <th class="p-4 font-semibold">Mã Phiếu/Đơn</th>
            <th class="p-4 font-semibold">Phân Loại</th>
            <th class="p-4 font-semibold">Đối Tác / Người tạo</th>
            <th class="p-4 font-semibold">Giá Trị / Ghi chú</th>
            <th class="p-4 font-semibold">Thời gian tạo</th>
            <th class="p-4 font-semibold text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredDanhSach" :key="item.madonhang" class="border-b hover:bg-gray-50 transition">
            <td class="p-4 font-black text-gray-800">#{{ item.madonhang }}</td>
            <td class="p-4">
              <span v-if="item.loaidonhang === 'nhap'" class="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200 rounded uppercase">📦 Nhập Kho</span>
              <span v-else-if="item.loaidonhang === 'xuat'" class="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 rounded uppercase">🚚 Xuất Kho</span>
              <span v-else class="px-2.5 py-1 bg-orange-50 text-orange-700 font-bold text-[10px] border border-orange-200 rounded uppercase">⚖️ Kiểm Kê</span>
            </td>
            <td class="p-4 font-medium text-gray-700">{{ item.tendoitac }}</td>
            <td class="p-4">
              <span v-if="item.loaidonhang !== 'kiemke'" class="font-black text-red-600">{{ formatCurrency(item.tonggiatri) }}</span>
              <span v-else class="text-orange-600 font-bold text-sm italic">Đối soát hàng hóa</span>
            </td>
            <td class="p-4 text-gray-500 text-sm font-medium">{{ new Date(item.ngaytao).toLocaleString('vi-VN') }}</td>
            
            <td class="p-4 flex gap-2 justify-center">
              <button @click="openDetail(item)" class="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-bold rounded hover:bg-gray-200 transition">Chi tiết</button>
              
              <template v-if="item.loaidonhang === 'kiemke'">
                <button @click="handleDuyetKiemKe(item.madonhang)" class="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded shadow-sm transition">Duyệt</button>
                <button @click="handleHuyKiemKe(item.madonhang)" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded transition">Từ chối</button>
              </template>
              <template v-else>
                <button @click="handleDuyetDonHang(item.madonhang, item.loaidonhang)" class="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white font-bold text-sm rounded shadow-sm transition">Duyệt</button>
                <button @click="handleHuyDonHang(item.madonhang)" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded transition">Từ chối</button>
              </template>
            </td>
          </tr>
          <tr v-if="filteredDanhSach.length === 0">
            <td colspan="6" class="p-20 text-center">
              <div class="text-6xl mb-4">🎉</div>
              <h3 class="text-xl font-bold text-gray-700 mb-1">Inbox Zero!</h3>
              <p class="text-gray-500 text-sm">Tuyệt vời, không còn yêu cầu nào đang chờ bạn phê duyệt.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div v-if="showDetailModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col border border-gray-100">
      <div class="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
        <div>
          <h3 class="text-xl font-bold text-gray-800">
            Chi tiết {{ selectedMaster?.loaidonhang === 'kiemke' ? 'Phiếu Kiểm Kê' : (selectedMaster?.loaidonhang === 'nhap' ? 'Phiếu Nhập' : 'Đơn Xuất') }}
            <span class="text-blue-600">#{{ selectedMaster?.madonhang || selectedMaster?.maphieu }}</span>
          </h3>
          <p class="text-xs text-gray-500 mt-1">Tổng quan & danh sách chi tiết</p>
        </div>
        <button @click="closeDetail" class="text-gray-400 hover:text-red-500 text-3xl leading-none font-bold transition">&times;</button>
      </div>

      <div v-if="isLoadingDetail" class="p-16 text-center text-gray-500">Đang tải chi tiết...</div>

      <div v-else class="p-6 flex-1 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 rounded-xl p-5 border border-gray-200">
          <div>
            <p class="text-xs text-gray-500 uppercase font-bold">Mã Phiếu/Đơn</p>
            <p class="font-bold text-gray-800">#{{ selectedMaster?.madonhang || selectedMaster?.maphieu }}</p>
          </div>
          <div v-if="!isKiemKeSelected">
            <p class="text-xs text-gray-500 uppercase font-bold">Đối tác</p>
            <p class="font-bold text-gray-800">{{ selectedMaster?.tendoitac || '---' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase font-bold">Người lập phiếu</p>
            <p class="font-bold text-gray-800">{{ selectedMaster?.tendangnhap || selectedMaster?.nguoitao || '---' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500 uppercase font-bold">Ngày tạo</p>
            <p class="font-bold text-gray-800">{{ new Date(selectedMaster?.ngaytao || selectedMaster?.ngaykiemke || Date.now()).toLocaleString('vi-VN') }}</p>
          </div>
          <div v-if="!isKiemKeSelected">
            <p class="text-xs text-gray-500 uppercase font-bold">Hóa đơn GTGT / Vận đơn</p>
            <p class="font-bold text-gray-800">{{ selectedMaster?.sohoadongtgt || selectedMaster?.mavandon3pl || '---' }}</p>
          </div>
  
        </div>

        <div class="bg-white border rounded-xl overflow-hidden shadow-sm">
          <div class="px-5 py-3 border-b bg-gray-50">
            <h4 class="font-bold text-gray-800 uppercase text-sm">Danh sách hàng hóa chi tiết</h4>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="text-[11px] text-gray-500 uppercase bg-gray-50 border-b">
                  <template v-if="!isKiemKeSelected">
                    <th class="px-5 py-3 font-bold">Tên thuốc</th>
                    <th class="px-5 py-3 font-bold">Số lô</th>
                    <th class="px-5 py-3 font-bold">Đơn vị</th>
                    <th class="px-5 py-3 font-bold text-right">Số lượng</th>
                    <th class="px-5 py-3 font-bold text-right">Đơn giá</th>
                    <th class="px-5 py-3 font-bold text-right">Thành tiền</th>
                  </template>
                  <template v-else>
                    <th class="px-5 py-3 font-bold">Lô thuốc</th>
                    <th class="px-5 py-3 font-bold text-right">Tồn hệ thống</th>
                    <th class="px-5 py-3 font-bold text-right">Số đếm thực tế</th>
                    <th class="px-5 py-3 font-bold text-right">Chênh lệch</th>
                    <th class="px-5 py-3 font-bold">Lý do</th>
                  </template>
                </tr>
              </thead>
              <tbody class="divide-y">
                <template v-if="!isKiemKeSelected">
                  <tr v-for="row in selectedDetails" :key="row.id || row.machitiet" class="hover:bg-gray-50 transition">
                    <td class="px-5 py-3 text-sm font-medium text-gray-800">{{ row.tenthuoc || row.tenThuoc || '---' }}</td>
                    <td class="px-5 py-3 text-sm text-gray-600 font-bold">{{ row.solo || row.solo_tam || row.malo || '---' }}</td>
                    <td class="px-5 py-3 text-sm text-gray-600">{{ getTenDonVi(row) }}</td>
                    <td class="px-5 py-3 text-sm text-right text-blue-600 font-bold">{{ row.soluongthucte ?? row.soluongyeucau ?? 0 }}</td>
                    <td class="px-5 py-3 text-sm text-right text-gray-700">{{ formatCurrency(row.dongia ?? row.gianhap ?? 0) }}</td>
                    <td class="px-5 py-3 text-sm text-right font-black text-gray-800">
                      {{ formatCurrency((Number(row.soluongthucte ?? row.soluongyeucau ?? 0)) * (Number(row.dongia ?? row.gianhap ?? 0))) }}
                    </td>
                  </tr>
                </template>
                <template v-else>
                  <tr v-for="row in selectedDetails" :key="row.id" class="hover:bg-gray-50 transition">
                    <td class="px-5 py-3 text-sm font-bold text-gray-800">{{ row.solo || row.malo || '---' }}</td>
                    <td class="px-5 py-3 text-sm text-right text-gray-500">{{ getTonHeThong(row) ?? '---' }}</td>
                    <td class="px-5 py-3 text-sm text-right font-bold text-blue-600">{{ getSoDemThucTe(row) ?? '---' }}</td>
                    <td class="px-5 py-3 text-sm text-right font-black" :class="Number(row.soluong_tru) > 0 ? 'text-red-600' : Number(row.soluong_tru) < 0 ? 'text-green-600' : 'text-gray-400'">
                      {{ Number(row.soluong_tru) > 0 ? `-${row.soluong_tru}` : Number(row.soluong_tru) < 0 ? `+${Math.abs(row.soluong_tru)}` : '0' }}
                    </td>
                    <td class="px-5 py-3 text-sm text-gray-600 italic">{{ row.lydo || '---' }}</td>
                  </tr>
                </template>
                <tr v-if="selectedDetails.length === 0">
                  <td :colspan="isKiemKeSelected ? 5 : 6" class="px-5 py-8 text-center text-gray-400 italic">Không có dữ liệu chi tiết.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="!isKiemKeSelected" class="flex justify-end mt-6">
          <div class="w-80 bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
            
            <div class="flex justify-between mb-3 text-sm text-orange-600 font-medium">
              <span>Chiết khấu:</span>
              <span>- {{ formatCurrency(selectedMaster?.tienchietkhau || 0) }}</span>
            </div>
            <div class="flex justify-between mb-3 text-sm text-blue-700 font-black border-t border-gray-200 pt-3">
              <span>Cần thanh toán:</span>
              <span>{{ formatCurrency(selectedMaster?.tonggiatri || 0) }}</span>
            </div>
            <div class="flex justify-between mb-3 text-sm text-green-600 font-bold">
              <span>Đã thanh toán (Đã trả):</span>
              <span>- {{ formatCurrency(selectedMaster?.tiendathanhtoan || 0) }}</span>
            </div>
            <div class="flex justify-between font-black text-red-600 text-lg border-t border-gray-200 pt-3 mt-1">
              <span>Công nợ phiếu này:</span>
              <span>{{ formatCurrency(Math.max(0, (selectedMaster?.tonggiatri || 0) - (selectedMaster?.tiendathanhtoan || 0))) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 border-t bg-gray-50 flex justify-end">
        <button @click="closeDetail" class="px-6 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl shadow-sm transition">Đóng lại</button>
      </div>
    </div>
  </div>
</template>