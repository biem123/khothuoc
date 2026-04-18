// Import kết nối database đã tạo ở bước trước
const db = require('../configs/db');

const ThuocModel = {
    // 1. Lấy tất cả danh sách thuốc
    getAll: async () => {
        const sql = 'SELECT * FROM thuoc ORDER BY mathuoc DESC';
        const [rows] = await db.query(sql);
        return rows;
    },

    // 2. Tìm thuốc theo ID (mathuoc)
    getById: async (id) => {
        const sql = 'SELECT * FROM thuoc WHERE mathuoc = ?';
        const [rows] = await db.query(sql, [id]);
        return rows;
    },

    // 3. Thêm mới thuốc
    // data: { tenthuoc, sodangky, dieukienbaoquan, mota, donvicoban, trangthai }
    create: async (data) => {
        const { tenthuoc, sodangky, dieukienbaoquan, mota, donvicoban, trangthai } = data;
        const sql = `INSERT INTO thuoc (tenthuoc, sodangky, dieukienbaoquan, mota, donvicoban, trangthai) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [tenthuoc, sodangky, dieukienbaoquan, mota, donvicoban, trangthai]);
        return result;
    },

    // 4. Cập nhật thông tin thuốc
    update: async (id, data) => {
        const { tenthuoc, sodangky, dieukienbaoquan, mota, donvicoban, trangthai } = data;
        const sql = `UPDATE thuoc 
                     SET tenthuoc = ?, sodangky = ?, dieukienbaoquan = ?, mota = ?, donvicoban = ?, trangthai = ? 
                     WHERE mathuoc = ?`;
        const [result] = await db.query(sql, [tenthuoc, sodangky, dieukienbaoquan, mota, donvicoban, trangthai, id]);
        return result;
    },

    // 5. Xóa thuốc
    delete: async (id) => {
        const sql = 'DELETE FROM thuoc WHERE mathuoc = ?';
        const [result] = await db.query(sql, [id]);
        return result;
    }
};

module.exports = ThuocModel;