const LoThuocModel = require('../models/lothuocModel');

const LoThuocController = {
    // Lấy tất cả lô thuốc
    getAllLoThuoc: async (req, res) => {
        try {
            const data = await LoThuocModel.getAll();
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Lấy các lô của 1 loại thuốc
    getLoByThuoc: async (req, res) => {
        try {
            const { mathuoc } = req.params;
            const data = await LoThuocModel.getByThuocId(mathuoc);
            res.status(200).json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Thêm lô mới (Nghiệp vụ nhập kho)
    createLoThuoc: async (req, res) => {
        try {
            const newLo = req.body;
            // Tự động gán tồn khả dụng = tồn thực tế nếu FE không gửi lên
            if (newLo.tonkhadung === undefined) {
                newLo.tonkhadung = newLo.tonthucte;
            }
            
            const result = await LoThuocModel.create(newLo);
            res.status(201).json({ success: true, message: "Thêm lô thuốc thành công", id_moi: result.insertId });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Cập nhật lô thuốc
    updateLoThuoc: async (req, res) => {
        try {
            const { malo } = req.params;
            const result = await LoThuocModel.update(malo, req.body);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy lô" });
            res.status(200).json({ success: true, message: "Cập nhật thành công" });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // Xóa lô thuốc
    deleteLoThuoc: async (req, res) => {
        try {
            const { malo } = req.params;
            const result = await LoThuocModel.delete(malo);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Không tìm thấy lô" });
            res.status(200).json({ success: true, message: "Xóa thành công" });
        } catch (error) {
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    }
};

module.exports = LoThuocController;