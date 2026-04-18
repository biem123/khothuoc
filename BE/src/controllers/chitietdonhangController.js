const chitietdonhangModel = require('../models/chitietdonhangModel');

const chitietdonhangController = {
    // Lấy chi tiết theo Mã Đơn Hàng
    getChiTietByDonHang: async (req, res) => {
        try {
            const { madonhang } = req.params;
            const data = await chitietdonhangModel.getByDonHangId(madonhang);
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Lấy 1 dòng chi tiết
    getChiTietById: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await chitietdonhangModel.getById(id);
            if (data.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy dữ liệu" });
            res.status(200).json({ success: true, data: data[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Thêm món hàng vào đơn
    createChiTiet: async (req, res) => {
        try {
            const result = await chitietdonhangModel.create(req.body);
            res.status(201).json({ success: true, message: "Thêm chi tiết đơn hàng thành công", mactdh_moi: result.insertId });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Cập nhật số lượng / giá
    updateChiTiet: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await chitietdonhangModel.update(id, req.body);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy chi tiết đơn hàng" });
            res.status(200).json({ success: true, message: "Cập nhật thành công" });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Xóa món hàng khỏi đơn
    deleteChiTiet: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await chitietdonhangModel.delete(id);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy chi tiết đơn hàng" });
            res.status(200).json({ success: true, message: "Xóa thành công" });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    }
};

module.exports = chitietdonhangController;