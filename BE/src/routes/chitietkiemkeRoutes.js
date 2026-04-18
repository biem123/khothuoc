const express = require('express');
const router = express.Router();
const chitietkiemkeController = require('../controllers/chitietkiemkeController');

router.get('/chitietkiemke/phieu/:maphieu', chitietkiemkeController.getByPhieu);
router.post('/chitietkiemke', chitietkiemkeController.create);
router.put('/chitietkiemke/:id', chitietkiemkeController.update);
router.delete('/chitietkiemke/:id', chitietkiemkeController.delete);

module.exports = router;