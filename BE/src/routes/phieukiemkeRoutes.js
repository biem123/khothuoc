const express = require('express');
const router = express.Router();
const phieukiemkeController = require('../controllers/phieukiemkeController');

router.get('/phieukiemke', phieukiemkeController.getAll);
router.get('/phieukiemke/:maphieu', phieukiemkeController.getById);
router.post('/phieukiemke', phieukiemkeController.create);
router.put('/phieukiemke/:maphieu/trangthai', phieukiemkeController.updateTrangThai);
router.delete('/phieukiemke/:maphieu', phieukiemkeController.delete);

module.exports = router;