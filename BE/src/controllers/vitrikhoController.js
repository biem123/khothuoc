const vitrikhoModel = require('../models/vitrikhoModel');

const vitrikhoController = {
    getAll: async (req, res) => {
        try {
            const data = await vitrikhoModel.getAll();
            res.status(200).json({ success: true, data });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    },
    getById: async (req, res) => {
        try {
            const data = await vitrikhoModel.getById(req.params.id);
            if (data.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy" });
            res.status(200).json({ success: true, data: data[0] });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    },
    create: async (req, res) => {
        try {
            await vitrikhoModel.create(req.body);
            res.status(201).json({ success: true, message: "Thêm vị trí thành công" });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    },
    update: async (req, res) => {
        try {
            const result = await vitrikhoModel.update(req.params.id, req.body);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy" });
            res.status(200).json({ success: true, message: "Cập nhật thành công" });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    },
    delete: async (req, res) => {
        try {
            const result = await vitrikhoModel.delete(req.params.id);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy" });
            res.status(200).json({ success: true, message: "Xóa thành công" });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }
};
module.exports = vitrikhoController;