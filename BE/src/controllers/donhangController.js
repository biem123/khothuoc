const donhangModel = require('../models/donhangModel');

const donhangController = {
    // Lấy tất cả
    getAllDonHang: async (req, res) => {
        try {
            const data = await donhangModel.getAll();
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Lấy 1 đơn
    getDonHangById: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await donhangModel.getById(id);
            if (data.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
            res.status(200).json({ success: true, data: data[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Lọc theo Loại (Nhập/Xuất)
    getDonHangByLoai: async (req, res) => {
        try {
            const { loaidonhang } = req.params;
            const data = await donhangModel.getByLoai(loaidonhang);
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Tạo đơn hàng mới
    createDonHang: async (req, res) => {
        try {
            const result = await donhangModel.create(req.body);
            res.status(201).json({ success: true, message: "Tạo đơn hàng thành công", madonhang_moi: result.insertId });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Đổi trạng thái (VD: Duyệt đơn, Hủy đơn)
    updateTrangThai: async (req, res) => {
        try {
            const { id } = req.params;
            const { trangthai } = req.body; // FE chỉ cần gửi { "trangthai": "daduyet" }
            
            if(!trangthai) return res.status(400).json({ success: false, message: "Thiếu dữ liệu trạng thái" });

            const result = await donhangModel.updateStatus(id, trangthai);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
            
            res.status(200).json({ success: true, message: `Đã chuyển trạng thái thành: ${trangthai}` });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Cập nhật thông tin đơn (Giá trị, ghi chú...)
    updateDonHang: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await donhangModel.update(id, req.body);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
            res.status(200).json({ success: true, message: "Cập nhật thành công" });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Xóa đơn
    deleteDonHang: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await donhangModel.delete(id);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
            res.status(200).json({ success: true, message: "Xóa thành công" });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    }
};

module.exports = donhangController;