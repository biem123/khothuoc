const donvitinhModel = require('../models/donvitinhModel');

const donvitinhController = {
    getAll: async (req, res) => {
        try {
            const data = await donvitinhModel.getAll();
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    getByThuoc: async (req, res) => {
        try {
            const { mathuoc } = req.params;
            const data = await donvitinhModel.getByThuocId(mathuoc);
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const result = await donvitinhModel.create(req.body);
            res.status(201).json({ success: true, message: "Thêm thành công", id_moi: result.insertId });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await donvitinhModel.update(id, req.body);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy" });
            res.status(200).json({ success: true, message: "Cập nhật thành công" });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await donvitinhModel.delete(id);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy" });
            res.status(200).json({ success: true, message: "Xóa thành công" });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = donvitinhController;