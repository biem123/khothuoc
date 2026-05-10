<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import VueApexCharts from 'vue3-apexcharts';

const tuNgay = ref('');
const denNgay = ref('');
const isLoading = ref(false);
const errorMsg = ref('');
const selectedQuarter = ref('');

const tongQuan = ref({
	doanhthu: 0,
	tongvon: 0,
	loinhuan: 0,
	sodonhang: 0
});

const bieuDo = ref<any[]>([]);
const topThuoc = ref<any[]>([]);

const formatCurrency = (val: number) =>
	new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

const chartSeries = computed(() => [
	{
		name: 'Doanh thu',
		type: 'column',
		data: bieuDo.value.map((item: any) => Number(item.doanhthu || 0))
	},
	{
		name: 'Lợi nhuận',
		type: 'line',
		data: bieuDo.value.map((item: any) => Number(item.loinhuan || 0))
	}
]);

const chartOptions = computed(() => ({
	chart: {
		height: 350,
		type: 'line',
		toolbar: { show: false }
	},
	stroke: { width: [0, 3], curve: 'smooth' },
	dataLabels: { enabled: false },
	colors: ['#3B82F6', '#F97316'],
	xaxis: {
		categories: bieuDo.value.map((item: any) => item.ngay),
		labels: { style: { colors: '#6B7280' } }
	},
	yaxis: [
		{
			labels: {
				formatter: (val: number) => `${Math.round(val / 1000)}k`,
				style: { colors: '#6B7280' }
			}
		},
		{
			opposite: true,
			labels: {
				formatter: (val: number) => `${Math.round(val / 1000)}k`,
				style: { colors: '#6B7280' }
			}
		}
	],
	grid: { borderColor: '#E5E7EB' },
	legend: { position: 'top', horizontalAlign: 'right' },
	tooltip: {
		y: {
			formatter: (val: number) => formatCurrency(val)
		}
	}
}));

const monthlyData = computed(() => {
	const bucket = new Map<string, { doanhthu: number; loinhuan: number }>();
	for (const item of bieuDo.value) {
		const key = String(item.ngay || '').slice(0, 7);
		if (!key) continue;
		const current = bucket.get(key) || { doanhthu: 0, loinhuan: 0 };
		current.doanhthu += Number(item.doanhthu || 0);
		current.loinhuan += Number(item.loinhuan || 0);
		bucket.set(key, current);
	}
	return Array.from(bucket.entries())
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([thang, values]) => ({ thang, ...values }));
});

const monthlySeries = computed(() => [
	{
		name: 'Doanh thu',
		type: 'column',
		data: monthlyData.value.map((item) => item.doanhthu)
	},
	{
		name: 'Lợi nhuận',
		type: 'line',
		data: monthlyData.value.map((item) => item.loinhuan)
	}
]);

const monthlyOptions = computed(() => ({
	chart: {
		height: 320,
		type: 'line',
		toolbar: { show: false }
	},
	stroke: { width: [0, 3], curve: 'smooth' },
	dataLabels: { enabled: false },
	colors: ['#6366F1', '#10B981'],
	xaxis: {
		categories: monthlyData.value.map((item) => item.thang),
		labels: { style: { colors: '#6B7280' } }
	},
	yaxis: [
		{
			labels: {
				formatter: (val: number) => `${Math.round(val / 1000)}k`,
				style: { colors: '#6B7280' }
			}
		},
		{
			opposite: true,
			labels: {
				formatter: (val: number) => `${Math.round(val / 1000)}k`,
				style: { colors: '#6B7280' }
			}
		}
	],
	grid: { borderColor: '#E5E7EB' },
	legend: { position: 'top', horizontalAlign: 'right' },
	tooltip: {
		y: {
			formatter: (val: number) => formatCurrency(val)
		}
	}
}));

const buildParams = () => {
	const params: Record<string, string> = {};
	if (tuNgay.value) params.tuNgay = tuNgay.value;
	if (denNgay.value) params.denNgay = denNgay.value;
	return params;
};

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);

const applyRange = (start: Date, end: Date) => {
	tuNgay.value = toDateInput(start);
	denNgay.value = toDateInput(end);
	selectedQuarter.value = '';
	loadData();
};

const applyLastDays = (days: number) => {
	const end = new Date();
	const start = new Date();
	start.setDate(end.getDate() - (days - 1));
	applyRange(start, end);
};

const applyThisMonth = () => {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth(), 1);
	const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
	applyRange(start, end);
};

const applyLastMonth = () => {
	const now = new Date();
	const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const end = new Date(now.getFullYear(), now.getMonth(), 0);
	applyRange(start, end);
};

const applyThisYear = () => {
	const now = new Date();
	const start = new Date(now.getFullYear(), 0, 1);
	const end = new Date(now.getFullYear(), 11, 31);
	applyRange(start, end);
};

const applyQuarter = (quarter: number, year: number) => {
	const startMonth = (quarter - 1) * 3;
	const start = new Date(year, startMonth, 1);
	const end = new Date(year, startMonth + 3, 0);
	applyRange(start, end);
};

const handleQuarterChange = () => {
	if (!selectedQuarter.value) return;
	const [yearStr, qStr] = selectedQuarter.value.split('-');
	const year = Number(yearStr);
	const quarter = Number(qStr.replace('Q', ''));
	if (year && quarter) applyQuarter(quarter, year);
};

const unwrapData = (res: any) => (res && typeof res === 'object' && 'data' in res ? res.data : res);

const loadData = async () => {
	isLoading.value = true;
	errorMsg.value = '';
	try {
		const params = buildParams();
		const [resTongQuan, resBieuDo, resTop]: any = await Promise.all([
			api.get('/thongke/tongquan', { params }),
			api.get('/thongke/bieudo', { params }),
			api.get('/thongke/top-thuoc', { params })
		]);

		if (resTongQuan?.success === false) throw new Error(resTongQuan?.message || 'Lỗi tổng quan');
		if (resBieuDo?.success === false) throw new Error(resBieuDo?.message || 'Lỗi biểu đồ');
		if (resTop?.success === false) throw new Error(resTop?.message || 'Lỗi top thuốc');

		const tongQuanData = unwrapData(resTongQuan) || { doanhthu: 0, tongvon: 0, loinhuan: 0, sodonhang: 0 };
		const bieuDoData = unwrapData(resBieuDo) || [];
		const topData = unwrapData(resTop) || [];

		tongQuan.value = tongQuanData;
		bieuDo.value = Array.isArray(bieuDoData) ? bieuDoData : [];
		topThuoc.value = Array.isArray(topData) ? topData : [];
	} catch (error: any) {
		errorMsg.value = error?.message || 'Không thể tải dữ liệu báo cáo.';
	} finally {
		isLoading.value = false;
	}
};

const handleFilter = () => {
	selectedQuarter.value = '';
	loadData();
};

const handlePrint = () => {
	window.print();
};

onMounted(() => {
	loadData();
});
</script>

<template>
	<div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 min-h-screen print-area">
		<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
			<div>
				<h2 class="text-2xl font-bold text-gray-800">📊 Báo cáo Doanh thu & Lợi nhuận</h2>
				<p class="text-sm text-gray-500 mt-1">Tổng quan hiệu quả kinh doanh theo thời gian</p>
			</div>

			<div class="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-wrap gap-3 items-end print-hidden">
				<div>
					<label class="block text-[11px] font-bold text-gray-500 uppercase mb-1">Từ ngày</label>
					<input v-model="tuNgay" type="date" class="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<div>
					<label class="block text-[11px] font-bold text-gray-500 uppercase mb-1">Đến ngày</label>
					<input v-model="denNgay" type="date" class="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500" />
				</div>
				<div>
					<label class="block text-[11px] font-bold text-gray-500 uppercase mb-1">Theo quý</label>
					<select v-model="selectedQuarter" @change="handleQuarterChange" class="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
						<option value="">Chọn quý</option>
						<option v-for="year in [new Date().getFullYear() - 1, new Date().getFullYear()]" :key="year" :value="`${year}-Q1`">Q1 / {{ year }}</option>
						<option v-for="year in [new Date().getFullYear() - 1, new Date().getFullYear()]" :key="`${year}-Q2`" :value="`${year}-Q2`">Q2 / {{ year }}</option>
						<option v-for="year in [new Date().getFullYear() - 1, new Date().getFullYear()]" :key="`${year}-Q3`" :value="`${year}-Q3`">Q3 / {{ year }}</option>
						<option v-for="year in [new Date().getFullYear() - 1, new Date().getFullYear()]" :key="`${year}-Q4`" :value="`${year}-Q4`">Q4 / {{ year }}</option>
					</select>
				</div>
				<button @click="handleFilter" :disabled="isLoading" class="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition disabled:bg-gray-400">
					Lọc dữ liệu
				</button>
				<button @click="handlePrint" class="h-10 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm transition">
					Xuất PDF
				</button>
			</div>
		</div>

		<div class="flex flex-wrap gap-2 mb-6 print-hidden">
			<button @click="applyLastDays(7)" class="px-3 py-1.5 text-xs font-bold rounded-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">7 ngày</button>
			<button @click="applyLastDays(30)" class="px-3 py-1.5 text-xs font-bold rounded-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100">30 ngày</button>
			<button @click="applyThisMonth" class="px-3 py-1.5 text-xs font-bold rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">Tháng này</button>
			<button @click="applyLastMonth" class="px-3 py-1.5 text-xs font-bold rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">Tháng trước</button>
			<button @click="applyThisYear" class="px-3 py-1.5 text-xs font-bold rounded-full border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100">Năm nay</button>
		</div>

		<div v-if="errorMsg" class="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-semibold">
			{{ errorMsg }}
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
			<div class="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-5 shadow-sm">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-xs font-bold text-blue-500 uppercase">Tổng doanh thu</p>
						<p class="text-2xl font-black text-blue-700 mt-2">{{ formatCurrency(tongQuan.doanhthu) }}</p>
					</div>
					<div class="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl">💰</div>
				</div>
			</div>

			<div class="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-2xl p-5 shadow-sm">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-xs font-bold text-amber-500 uppercase">Tổng vốn</p>
						<p class="text-2xl font-black text-amber-700 mt-2">{{ formatCurrency(tongQuan.tongvon) }}</p>
					</div>
					<div class="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center text-xl">📦</div>
				</div>
			</div>

			<div class="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-5 shadow-sm">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-xs font-bold text-emerald-500 uppercase">Lợi nhuận gộp</p>
						<p class="text-2xl font-black text-emerald-700 mt-2">{{ formatCurrency(tongQuan.loinhuan) }}</p>
					</div>
					<div class="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl">📈</div>
				</div>
			</div>

			<div class="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-5 shadow-sm">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-xs font-bold text-slate-500 uppercase">Số đơn hàng</p>
						<p class="text-2xl font-black text-slate-700 mt-2">{{ tongQuan.sodonhang }}</p>
					</div>
					<div class="w-12 h-12 rounded-full bg-slate-600 text-white flex items-center justify-center text-xl">🧾</div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
			<div class="xl:col-span-2 bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
				<div class="flex items-center justify-between mb-4">
					<h3 class="font-bold text-gray-800 uppercase text-sm">Biểu đồ Doanh thu & Lợi nhuận</h3>
					<span class="text-xs text-gray-400">Theo ngày</span>
				</div>
				<div v-if="isLoading" class="h-[350px] flex items-center justify-center text-gray-400">
					Đang tải biểu đồ...
				</div>
				<div v-else-if="bieuDo.length === 0" class="h-[350px] flex items-center justify-center text-gray-400">
					Không có dữ liệu biểu đồ.
				</div>
				<VueApexCharts
					v-else
					height="350"
					:options="chartOptions"
					:series="chartSeries"
				/>
				<div class="mt-6">
					<div class="flex items-center justify-between mb-3">
						<h4 class="font-bold text-gray-800 uppercase text-xs">So sánh theo tháng</h4>
						<span class="text-xs text-gray-400">Tổng hợp</span>
					</div>
					<div v-if="isLoading" class="h-[320px] flex items-center justify-center text-gray-400">
						Đang tải biểu đồ tháng...
					</div>
					<div v-else-if="monthlyData.length === 0" class="h-[320px] flex items-center justify-center text-gray-400">
						Không có dữ liệu theo tháng.
					</div>
					<VueApexCharts
						v-else
						height="320"
						:options="monthlyOptions"
						:series="monthlySeries"
					/>
				</div>
			</div>

			<div class="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
				<div class="flex items-center justify-between mb-4">
					<h3 class="font-bold text-gray-800 uppercase text-sm">Top thuốc bán chạy</h3>
					<span class="text-xs text-gray-400">Theo doanh thu</span>
				</div>

				<div v-if="isLoading" class="h-[350px] flex items-center justify-center text-gray-400">
					Đang tải danh sách...
				</div>
				<div v-else-if="topThuoc.length === 0" class="h-[350px] flex items-center justify-center text-gray-400">
					Không có dữ liệu.
				</div>
				<div v-else class="overflow-x-auto">
					<table class="w-full text-left text-sm">
						<thead>
							<tr class="text-[11px] text-gray-500 uppercase border-b">
								<th class="py-2">Thuốc</th>
								<th class="py-2 text-right">SL</th>
								<th class="py-2 text-right">Doanh thu</th>
							</tr>
						</thead>
						<tbody class="divide-y">
							<tr v-for="row in topThuoc" :key="row.mathuoc" class="hover:bg-gray-50">
								<td class="py-2">
									<p class="font-medium text-gray-700">{{ row.tenthuoc }}</p>
									<p class="text-[10px] text-gray-400">{{ row.mathuoc }}</p>
								</td>
								<td class="py-2 text-right text-blue-600 font-bold">{{ row.tongsoluong }}</td>
								<td class="py-2 text-right font-semibold text-gray-700">{{ formatCurrency(row.doanhthu) }}</td>
							</tr>
						</tbody>
					</table>
				</div>
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
