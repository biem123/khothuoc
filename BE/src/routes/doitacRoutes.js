const express = require('express');
const router = express.Router();
const DoiTacController = require('../controllers/doitacController');

router.get('/doitac', DoiTacController.getAllDoiTac);

// Đừng quên test API này nhé: GET /api/doitac/loai/NhaCungCap
router.get('/doitac/loai/:loaidoitac', DoiTacController.getDoiTacByLoai); 
router.get('/doitac/:id', DoiTacController.getDoiTacById);

router.post('/doitac', DoiTacController.createDoiTac);
router.put('/doitac/:id', DoiTacController.updateDoiTac);
router.delete('/doitac/:id', DoiTacController.deleteDoiTac);

module.exports = router;