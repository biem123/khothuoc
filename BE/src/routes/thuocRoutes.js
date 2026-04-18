// src/routes/thuocRoutes.js
const express = require('express');
const router = express.Router();
const ThuocController = require('../controllers/thuocController');

router.get('/thuoc', ThuocController.getAllThuoc);
router.get('/thuoc/:id', ThuocController.getThuocById);
router.post('/thuoc', ThuocController.createThuoc);
router.put('/thuoc/:id', ThuocController.updateThuoc);
router.delete('/thuoc/:id', ThuocController.deleteThuoc);

module.exports = router;