<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const danhSachThuoc = ref([]);
const displayedThuoc = ref([]);
const isLoading = ref(false);

// --- CÁC BIẾN CHO POPUP ---
const showModal = ref(false);
const isSaving = ref(false);
const isEditMode = ref(false); // Biến mới: Xác định xem đang Thêm hay Sửa
const editingId = ref<number | null>(null); // Biến mới: Lưu lại ID của thuốc đang sửa

const searchQuery = ref('');

const defaultForm = {
  tenthuoc: '',
  sodangky: '',
  donvicoban: '',
  dieukienbaoquan: '',
  mota: '',
  trangthai: 1
};

// Dùng spread operator để copy, tránh lỗi tham chiếu
const formData = ref({ ...defaultForm });
// --- HÀM LỌC THUỐC THEO TÊN, SỐ ĐK, MÃ THUỐC (realtime theo input) ---
const applySearch = () => {
  const lowerCaseQuery = searchQuery.value.trim().toLowerCase();
  if (!lowerCaseQuery) {
    displayedThuoc.value = danhSachThuoc.value;
    return;
  }

  displayedThuoc.value = danhSachThuoc.value.filter((thuoc: any) =>
    // Tìm theo tên thuốc, hoặc số đăng ký, hoặc mã thuốc
    (thuoc.tenthuoc || '').toLowerCase().includes(lowerCaseQuery) ||
    (thuoc.sodangky && thuoc.sodangky.toLowerCase().includes(lowerCaseQuery)) ||
    String(thuoc.mathuoc || '').includes(lowerCaseQuery)
  );
};

const onSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  searchQuery.value = target.value;
  applySearch();
};
// --- HÀM TẢI DỮ LIỆU ---
const loadData = async () => {
  isLoading.value = true;
  try {
    const res: any = await api.get('/thuoc');
    danhSachThuoc.value = res.data;
    applySearch();
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu thuốc:', error);
  } finally {
    isLoading.value = false;
  }
};

// --- MỞ POPUP THÊM MỚI ---
const openAddModal = () => {
  isEditMode.value = false;
  editingId.value = null;
  formData.value = { ...defaultForm }; // Làm sạch form
  showModal.value = true;
};

// --- MỞ POPUP SỬA ---
const openEditModal = (thuoc: any) => {
  isEditMode.value = true;
  editingId.value = thuoc.mathuoc;
  // Copy toàn bộ dữ liệu của dòng đó đập vào form
  formData.value = { ...thuoc }; 
  showModal.value = true;
};

// --- HÀM LƯU (Xử lý cả Thêm và Sửa) ---
const handleSave = async () => {
  if (!authStore.isAdmin) {
    alert('Bạn không có quyền chỉnh sửa thuốc');
    return;
  }
  if (!formData.value.tenthuoc || !formData.value.donvicoban) {
    alert("Vui lòng nhập Tên thuốc và Đơn vị cơ bản!");
    return;
  }

  isSaving.value = true;
  try {
    if (isEditMode.value) {
      // Nếu là chế độ sửa -> Gọi API Update (PUT/PATCH tùy Backend bạn viết)
      // Theo Controller của bạn thì update cần /api/thuoc/:id
      const res: any = await api.put(`/thuoc/${editingId.value}`, formData.value);
      alert(res.message || "Cập nhật thành công!");
    } else {
      // Nếu là chế độ thêm -> Gọi API Create (POST)
      const res: any = await api.post('/thuoc', formData.value);
      alert(res.message || "Thêm thành công!");
    }
    
    showModal.value = false;
    loadData(); // F5 lại bảng
  } catch (error: any) {
    alert(error.message || "Thao tác thất bại");
  } finally {
    isSaving.value = false;
  }
};

// --- HÀM XÓA ---
const handleDelete = async (mathuoc: number) => {
  if (!authStore.isAdmin) {
    alert('Bạn không có quyền xóa thuốc');
    return;
  }
  if (confirm("Bạn có chắc chắn muốn xóa thuốc này?")) {
    try {
      await api.delete(`/thuoc/${mathuoc}`);
      loadData();
    } catch (error: any) {
      alert(error.message || "Xóa thất bại");
    }
  }
};

onMounted(() => loadData());
</script>

<template>
  <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Danh mục Thuốc</h2>
      <div class="flex gap-4 items-center">
        <div class="relative">
          <input 
            :value="searchQuery"
            @input="onSearchInput"
            type="text" 
            placeholder="Tìm theo tên, mã, SĐK..." 
            class="pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none w-64 text-sm"
          >
          <span class="absolute right-3 top-2.5 text-gray-400"></span>
        </div>


      <button v-if="authStore.isAdmin" @click="openAddModal" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
        + Thêm thuốc mới
      </button>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50 text-gray-600 text-sm border-b">
            <th class="p-4 font-semibold">Mã</th>
            <th class="p-4 font-semibold">Tên Thuốc</th>
            <th class="p-4 font-semibold">Số ĐK</th>
            <th class="p-4 font-semibold">ĐV Cơ Bản</th>
            <th class="p-4 font-semibold">Bảo Quản</th>
            <th class="p-4 font-semibold">Trạng Thái</th>
            <th class="p-4 font-semibold">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="thuoc in displayedThuoc" :key="thuoc.mathuoc" class="border-b hover:bg-gray-50">
            <td class="p-4 font-medium text-gray-800">#{{ thuoc.mathuoc }}</td>
            <td class="p-4 text-blue-600 font-medium">{{ thuoc.tenthuoc }}</td>
            <td class="p-4 text-gray-600">{{ thuoc.sodangky || '---' }}</td>
            <td class="p-4 text-gray-600 font-medium">{{ thuoc.donvicoban }}</td>
            <td class="p-4 text-gray-500 text-sm">{{ thuoc.dieukienbaoquan || '---' }}</td>
            <td class="p-4">
              <span :class="thuoc.trangthai === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" 
                    class="px-2 py-1 rounded-md text-xs font-bold">
                {{ thuoc.trangthai === 1 ? 'Kinh doanh' : 'Ngừng KD' }}
              </span>
            </td>
            <td class="p-4">
              <button v-if="authStore.isAdmin" @click="openEditModal(thuoc)" class="text-blue-600 hover:underline font-medium mr-3">Sửa</button>
              <button v-if="authStore.isAdmin" @click="handleDelete(thuoc.mathuoc)" class="text-red-600 hover:underline font-medium">Xóa</button>
            </td>
          </tr>
          <tr v-if="displayedThuoc.length === 0">
            <td colspan="7" class="p-8 text-center text-gray-500">
              {{ searchQuery ? 'Không tìm thấy thuốc phù hợp.' : 'Chưa có dữ liệu thuốc nào trong kho.' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl shadow-lg w-[600px] max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-gray-800">
            {{ isEditMode ? 'Cập nhật thông tin thuốc' : 'Thêm thuốc mới' }}
          </h3>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
        </div>
        

        <form @submit.prevent="handleSave" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tên thuốc (*)</label>
            <input v-model="formData.tenthuoc" type="text" placeholder="Nhập tên thuốc..." class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none" required>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Số đăng ký</label>
              <input v-model="formData.sodangky" type="text" placeholder="VD: VD-12345-19" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Đơn vị cơ bản (*)</label>
                <select v-model="formData.donvicoban" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white" required>
                    <option value="" disabled>-- Chọn đơn vị --</option>
                    <option value="Viên">Viên</option>
                    <option value="Vỉ">Vỉ</option>
                    <option value="Hộp">Hộp</option>
                    <option value="Lọ">Lọ</option>
                    <option value="Chai">Chai</option>
                    <option value="Tuýp">Tuýp</option>
                    <option value="Gói">Gói</option>
                    <option value="Ống">Ống</option>
                    <option value="Thùng">Thùng</option>
                </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Điều kiện bảo quản</label>
                <select v-model="formData.dieukienbaoquan" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white">
                    <option value="" disabled>-- Chọn điều kiện bảo quản --</option>
                    <option value="Nơi khô ráo, dưới 30°C">Nơi khô ráo, dưới 30°C</option>
                    <option value="Nơi khô mát, dưới 30°C">Nơi khô mát, dưới 30°C</option>
                    <option value="Nơi khô ráo, tránh ánh sáng, dưới 30°C">Nơi khô ráo, tránh ánh sáng, dưới 30°C</option>
                    <option value="Bảo quản dưới 25°C">Bảo quản dưới 25°C</option>
                    <option value="Tránh ánh sáng, bảo quản ở nhiệt độ 15°C - 25°C">Tránh ánh sáng, bảo quản ở nhiệt độ 15°C - 25°C</option>
                    <option value="Bảo quản lạnh (2°C - 8°C)">Bảo quản lạnh (2°C - 8°C)</option>
                    <option value="Nhiệt độ dưới 30°C, không được đóng băng">Nhiệt độ dưới 30°C, không được đóng băng</option>
                    <option value="Đậy kín nắp, tránh ẩm tuyệt đối, dưới 25°C">Đậy kín nắp, tránh ẩm tuyệt đối, dưới 25°C</option>
                </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select v-model="formData.trangthai" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-white">
                <option :value="1">Đang kinh doanh</option>
                <option :value="0">Ngừng kinh doanh</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mô tả thêm</label>
            <textarea v-model="formData.mota" rows="3" placeholder="Chỉ định, chống chỉ định, lưu ý..." class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none"></textarea>
          </div>

          <div class="flex justify-end gap-3 mt-8 pt-4 border-t">
            <button type="button" @click="showModal = false" class="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Hủy</button>
            <button type="submit" :disabled="isSaving" class="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center gap-2">
              <span v-if="isSaving">Đang lưu...</span>
              <span v-else>{{ isEditMode ? 'Cập nhật' : 'Lưu thông tin' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>