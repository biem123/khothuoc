// Import Model (Chúng ta sẽ viết file Model ngay sau bước này)
const ThuocModel = require('../models/thuocModel');

const ThuocController = {
    // 1. LẤY DANH SÁCH TẤT CẢ THUỐC (Read All)
    getAllThuoc: async (req, res) => {
        try {
            const danhSachThuoc = await ThuocModel.getAll();
            res.status(200).json({
                success: true,
                message: "Lấy danh sách thành công",
                data: danhSachThuoc
            });
        } catch (error) {
            console.error("Lỗi get all thuốc:", error);
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // 2. LẤY THÔNG TIN 1 LOẠI THUỐC THEO MÃ (Read One)
    getThuocById: async (req, res) => {
        try {
            const { id } = req.params; // Lấy ID từ URL (VD: /api/thuoc/5)
            const thuoc = await ThuocModel.getById(id);
            
            if (thuoc.length === 0) {
                return res.status(404).json({ success: false, message: "Không tìm thấy thuốc này" });
            }
            
            res.status(200).json({
                success: true,
                message: "Tìm thấy dữ liệu",
                data: thuoc[0]
            });
        } catch (error) {
            console.error("Lỗi get thuốc by ID:", error);
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // 3. THÊM MỚI MỘT LOẠI THUỐC (Create)
    createThuoc: async (req, res) => {
        try {
            const newThuocData = req.body; // Dữ liệu Frontend gửi lên nằm ở đây
            
            // Có thể thêm bước Validate dữ liệu ở đây (Ví dụ: kiểm tra trùng mã)
            if (!newThuocData.tenthuoc) {
                return res.status(400).json({ success: false, message: "Tên thuốc không được để trống" });
            }

            const result = await ThuocModel.create(newThuocData);
            
            res.status(201).json({
                success: true,
                message: "Thêm mới thuốc thành công",
                data: { id: result.insertId, ...newThuocData }
            });
        } catch (error) {
            console.error("Lỗi create thuốc:", error);
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // 4. CẬP NHẬT THÔNG TIN THUỐC (Update)
    updateThuoc: async (req, res) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            const result = await ThuocModel.update(id, updateData);

            if (result.affectedRows === 0) {
                 return res.status(404).json({ success: false, message: "Không tìm thấy thuốc để cập nhật" });
            }

            res.status(200).json({
                success: true,
                message: "Cập nhật thành công"
            });
        } catch (error) {
            console.error("Lỗi update thuốc:", error);
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    },

    // 5. XÓA MỘT LOẠI THUỐC (Delete)
    deleteThuoc: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await ThuocModel.delete(id);

            if (result.affectedRows === 0) {
                 return res.status(404).json({ success: false, message: "Không tìm thấy thuốc để xóa" });
            }

            res.status(200).json({ 
                success: true, 
                message: "Xóa thuốc thành công" 
            });
        } catch (error) {
            console.error("Lỗi delete thuốc:", error);
            res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
        }
    }
};

module.exports = ThuocController;