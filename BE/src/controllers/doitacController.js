const DoiTacModel = require('../models/doitacModel');

const DoiTacController = {
    // Lấy tất cả
    getAllDoiTac: async (req, res) => {
        try {
            const data = await DoiTacModel.getAll();
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Lấy chi tiết 1 đối tác
    getDoiTacById: async (req, res) => {
        try {
            const { id } = req.params;
            const data = await DoiTacModel.getById(id);
            if (data.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy đối tác" });
            res.status(200).json({ success: true, data: data[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Lọc theo Loại (Nhà cung cấp / Khách hàng)
    getDoiTacByLoai: async (req, res) => {
        try {
            const { loaidoitac } = req.params;
            const data = await DoiTacModel.getByLoai(loaidoitac);
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Thêm mới
    createDoiTac: async (req, res) => {
        try {
            if (!req.body.tendoitac || !req.body.loaidoitac) {
                return res.status(400).json({ success: false, message: "Tên và Loại đối tác là bắt buộc" });
            }
            const result = await DoiTacModel.create(req.body);
            res.status(201).json({ success: true, message: "Thêm đối tác thành công", id_moi: result.insertId });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Cập nhật
    updateDoiTac: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await DoiTacModel.update(id, req.body);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy đối tác" });
            res.status(200).json({ success: true, message: "Cập nhật thành công" });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Xóa
    deleteDoiTac: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await DoiTacModel.delete(id);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy đối tác" });
            res.status(200).json({ success: true, message: "Xóa thành công" });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    }
};

module.exports = DoiTacController;