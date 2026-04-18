const phieukiemkeModel = require('../models/phieukiemkeModel');

const phieukiemkeController = {
    getAll: async (req, res) => {
        try {
            const data = await phieukiemkeModel.getAll();
            res.status(200).json({ success: true, data });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    },
    getById: async (req, res) => {
        try {
            const data = await phieukiemkeModel.getById(req.params.maphieu);
            if (data.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy phiếu" });
            res.status(200).json({ success: true, data: data[0] });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    },
    create: async (req, res) => {
        try {
            if(!req.body.maphieu) return res.status(400).json({ success: false, message: "Mã phiếu là bắt buộc" });
            await phieukiemkeModel.create(req.body);
            res.status(201).json({ success: true, message: "Tạo phiếu kiểm kê thành công", maphieu: req.body.maphieu });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    },
    updateTrangThai: async (req, res) => {
        try {
            const result = await phieukiemkeModel.updateTrangThai(req.params.maphieu, req.body.trangthai);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy phiếu" });
            res.status(200).json({ success: true, message: "Cập nhật trạng thái thành công" });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    },
    delete: async (req, res) => {
        try {
            const result = await phieukiemkeModel.delete(req.params.maphieu);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy phiếu" });
            res.status(200).json({ success: true, message: "Xóa thành công" });
        } catch (error) { res.status(500).json({ success: false, error: error.message }); }
    }
};
module.exports = phieukiemkeController;