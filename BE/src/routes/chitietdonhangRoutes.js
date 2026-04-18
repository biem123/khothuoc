const express = require('express');
const router = express.Router();
const chitietdonhangController = require('../controllers/chitietdonhangController');

// Tuyến đường lấy TOÀN BỘ CÁC MÓN của 1 đơn hàng cụ thể
// 👉 Test trên Postman: GET /api/chitietdonhang/donhang/7
router.get('/chitietdonhang/donhang/:madonhang', chitietdonhangController.getChiTietByDonHang);

router.get('/chitietdonhang/:id', chitietdonhangController.getChiTietById);
router.post('/chitietdonhang', chitietdonhangController.createChiTiet);
router.put('/chitietdonhang/:id', chitietdonhangController.updateChiTiet);
router.delete('/chitietdonhang/:id', chitietdonhangController.deleteChiTiet);

module.exports = router;