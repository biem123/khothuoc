const db = require('../configs/db');

const LoThuocModel = {
    // 1. Lấy tất cả lô thuốc (kèm tên thuốc cho dễ nhìn)
    getAll: async () => {
        const sql = `SELECT l.*, t.tenthuoc 
                     FROM lothuoc l 
                     JOIN thuoc t ON l.mathuoc = t.mathuoc 
                     ORDER BY l.ngaynhap DESC`;
        const [rows] = await db.query(sql);
        return rows;
    },

    // 2. Lấy danh sách lô theo mã thuốc (Rất cần cho giao diện bán hàng)
    getByThuocId: async (mathuoc) => {
        const sql = `SELECT * FROM lothuoc WHERE mathuoc = ? AND tonkhadung > 0 ORDER BY hansudung ASC`;
        const [rows] = await db.query(sql, [mathuoc]);
        return rows;
    },

    // 3. Thêm mới một lô thuốc (Nhập kho)
    create: async (data) => {
        const { solo, mathuoc, tonthucte, tonkhadung, hansudung, mavitri, trangthai, ngaynhap, ngaysanxuat } = data;
        const sql = `INSERT INTO lothuoc 
                    (solo, mathuoc, tonthucte, tonkhadung, hansudung, mavitri, trangthai, ngaynhap, ngaysanxuat) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [solo, mathuoc, tonthucte, tonkhadung, hansudung, mavitri, trangthai, ngaynhap, ngaysanxuat]);
        return result;
    },

    // 4. Cập nhật thông tin lô (Sửa số lượng, đổi vị trí kệ...)
    update: async (malo, data) => {
        const { solo, mavitri, ngaysanxuat, hansudung, tonthucte, tonkhadung, trangthai } = data;
        const sql = `UPDATE lothuoc 
                     SET solo = ?, mavitri = ?, ngaysanxuat = ?, hansudung = ?, tonthucte = ?, tonkhadung = ?, trangthai = ? 
                     WHERE malo = ?`;
        const [result] = await db.query(sql, [solo, mavitri, ngaysanxuat, hansudung, tonthucte, tonkhadung, trangthai, malo]);
        return result;
    },

    // 5. Xóa lô thuốc (Chỉ dùng khi nhập sai hoàn toàn)
    delete: async (malo) => {
        const sql = 'DELETE FROM lothuoc WHERE malo = ?';
        const [result] = await db.query(sql, [malo]);
        return result;
    }
};

module.exports = LoThuocModel;