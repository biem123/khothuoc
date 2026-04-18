const express = require('express');
const router = express.Router();
const donhangController = require('../controllers/donhangController');

// Lấy danh sách tổng
router.get('/donhang', donhangController.getAllDonHang);

// Lọc đơn hàng Nhập / Xuất (Bắt buộc phải để trước dòng /:id)
// Test thử: GET /api/donhang/loai/Nhap
router.get('/donhang/loai/:loaidonhang', donhangController.getDonHangByLoai);

// Lấy chi tiết theo ID
router.get('/donhang/:id', donhangController.getDonHangById);

// Tạo mới
router.post('/donhang', donhangController.createDonHang);

// Cập nhật TRẠNG THÁI đơn hàng (API chuyên dụng)
// Test: PUT /api/donhang/1/trangthai với body JSON: { "trangthai": "daduyet" }
router.put('/donhang/:id/trangthai', donhangController.updateTrangThai);

// Cập nhật thông tin chung
router.put('/donhang/:id', donhangController.updateDonHang);

// Xóa đơn hàng
router.delete('/donhang/:id', donhangController.deleteDonHang);

module.exports = router;