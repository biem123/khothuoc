const express = require('express');
const router = express.Router();
const LoThuocController = require('../controllers/lothuocController');

router.get('/lothuoc', LoThuocController.getAllLoThuoc);
router.get('/lothuoc/thuoc/:mathuoc', LoThuocController.getLoByThuoc); // API này rất quan trọng
router.post('/lothuoc', LoThuocController.createLoThuoc);
router.put('/lothuoc/:malo', LoThuocController.updateLoThuoc);
router.delete('/lothuoc/:malo', LoThuocController.deleteLoThuoc);

module.exports = router;