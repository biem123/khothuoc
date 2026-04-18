const express = require('express');
const router = express.Router();
const taikhoanController = require('../controllers/taikhoanController');

// Đăng nhập gọi bằng phương thức POST (Gửi data ngầm trong body)
router.post('/taikhoan/login', taikhoanController.login);
router.put('/taikhoan/doimatkhau/:id', taikhoanController.doiMatKhau);

router.get('/taikhoan', taikhoanController.getAll);
router.post('/taikhoan', taikhoanController.create);
router.put('/taikhoan/:id', taikhoanController.update);
router.delete('/taikhoan/:id', taikhoanController.delete);

module.exports = router;