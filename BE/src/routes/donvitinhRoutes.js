const express = require('express');
const router = express.Router();
const donvitinhController = require('../controllers/donvitinhController');

router.get('/donvitinh', donvitinhController.getAll);
// Đưa route cụ thể lên trên
router.get('/donvitinh/thuoc/:mathuoc', donvitinhController.getByThuoc); 
router.post('/donvitinh', donvitinhController.create);
router.put('/donvitinh/:id', donvitinhController.update);
router.delete('/donvitinh/:id', donvitinhController.delete);

module.exports = router;