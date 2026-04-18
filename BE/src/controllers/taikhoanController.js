const taikhoanModel = require('../models/taikhoanModel');
const bcrypt = require('bcrypt');

const taikhoanController = {
    // 1. API Đăng nhập (Xử lý cả pass thường lẫn pass hash)
    login: async (req, res) => {
        try {
            const { tendangnhap, matkhau } = req.body;
            
            if (!tendangnhap || !matkhau) {
                return res.status(400).json({ success: false, message: "Vui lòng nhập tài khoản và mật khẩu" });
            }

            const users = await taikhoanModel.getByUsername(tendangnhap);
            if (users.length === 0) {
                return res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu" });
            }

            const user = users[0];
            let isMatch = false;

            if (user.matkhau.startsWith('$2')) {
                isMatch = await bcrypt.compare(matkhau, user.matkhau);
            } else {
                isMatch = (matkhau === user.matkhau);
            }

            if (!isMatch) {
                return res.status(401).json({ success: false, message: "Sai tên đăng nhập hoặc mật khẩu" });
            }

            res.status(200).json({
                success: true,
                message: "Đăng nhập thành công",
                data: { mataikhoan: user.mataikhoan, tendangnhap: user.tendangnhap, vaitro: user.vaitro }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // 2. API Đổi mật khẩu
    doiMatKhau: async (req, res) => {
        try {
            const { id } = req.params; 
            const { matKhauCu, matKhauMoi } = req.body;

            if (!matKhauCu || !matKhauMoi) {
                return res.status(400).json({ success: false, message: "Vui lòng nhập đủ mật khẩu cũ và mới" });
            }

            // 🔥 ĐÃ SỬA: Gọi thẳng getById thay vì getAll
            const users = await taikhoanModel.getById(id); 
            
            if (users.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
            const user = users[0]; // Lấy thẳng user đầu tiên

            // Kiểm tra mật khẩu cũ
            let isMatch = false;
            if (user.matkhau.startsWith('$2')) {
                isMatch = await bcrypt.compare(matKhauCu, user.matkhau);
            } else {
                isMatch = (matKhauCu === user.matkhau);
            }
            
            if (!isMatch) return res.status(400).json({ success: false, message: "Mật khẩu cũ không chính xác" });

            // Băm mật khẩu mới và lưu xuống DB
            const hashedMatKhauMoi = await bcrypt.hash(matKhauMoi, 10);
            await taikhoanModel.update(id, { matkhau: hashedMatKhauMoi, vaitro: user.vaitro });

            res.status(200).json({ success: true, message: "Đổi mật khẩu thành công" });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // 3. API Lấy danh sách tài khoản
    getAll: async (req, res) => {
        try {
            const data = await taikhoanModel.getAll();
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // 4. API Tạo tài khoản mới (Bắt buộc Hash mật khẩu)
    create: async (req, res) => {
        try {
            const { tendangnhap, matkhau, vaitro } = req.body;

            if (!tendangnhap || !matkhau) {
                return res.status(400).json({ success: false, message: "Tên đăng nhập và mật khẩu là bắt buộc" });
            }

            // Băm mật khẩu trước khi lưu
            const hashedMatKhau = await bcrypt.hash(matkhau, 10);
            
            const dataToSave = {
                tendangnhap,
                matkhau: hashedMatKhau,
                vaitro
            };

            const result = await taikhoanModel.create(dataToSave);
            res.status(201).json({ success: true, message: "Tạo tài khoản thành công", id_moi: result.insertId });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // 5. API Cập nhật tài khoản (Có kiểm tra Hash nếu đổi pass)
    update: async (req, res) => {
        try {
            const { id } = req.params;
            let { matkhau, vaitro } = req.body;

            // Nếu người dùng có gửi mật khẩu mới lên để cập nhật, ta phải hash nó
            if (matkhau) {
                 matkhau = await bcrypt.hash(matkhau, 10);
            }

            const result = await taikhoanModel.update(id, { matkhau, vaitro });
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
            res.status(200).json({ success: true, message: "Cập nhật thành công" });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // 6. API Xóa tài khoản
    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await taikhoanModel.delete(id);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy tài khoản" });
            res.status(200).json({ success: true, message: "Xóa thành công" });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = taikhoanController;