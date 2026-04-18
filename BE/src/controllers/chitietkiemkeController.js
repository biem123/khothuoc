const chitietkiemkeModel = require('../models/chitietkiemkeModel');

const chitietkiemkeController = {
    getByPhieu: async (req, res) => {
        try {
            const data = await chitietkiemkeModel.getByPhieuId(req.params.maphieu);
            res.status(200).json({ success: true, data });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    },
    create: async (req, res) => {
        try {
            const result = await chitietkiemkeModel.create(req.body);
            res.status(201).json({ success: true, message: "Thêm chi tiết thành công", id_moi: result.insertId });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    },
    update: async (req, res) => {
        try {
            const result = await chitietkiemkeModel.update(req.params.id, req.body);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy" });
            res.status(200).json({ success: true, message: "Cập nhật thành công" });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    },
    delete: async (req, res) => {
        try {
            const result = await chitietkiemkeModel.delete(req.params.id);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy" });
            res.status(200).json({ success: true, message: "Xóa thành công" });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }
};
module.exports = chitietkiemkeController;