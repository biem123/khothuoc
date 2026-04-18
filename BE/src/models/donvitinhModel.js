const db = require('../configs/db');

const donvitinhModel = {
    // Lấy tất cả đơn vị tính (kèm tên thuốc cho dễ quản lý)
    getAll: async () => {
        const sql = `SELECT dv.*, t.tenthuoc 
                     FROM donvitinh dv
                     LEFT JOIN thuoc t ON dv.mathuoc = t.mathuoc`;
        const [rows] = await db.query(sql);
        return rows;
    },

    // Lấy danh sách đơn vị tính CỦA 1 LOẠI THUỐC cụ thể
    getByThuocId: async (mathuoc) => {
        const sql = 'SELECT * FROM donvitinh WHERE mathuoc = ?';
        const [rows] = await db.query(sql, [mathuoc]);
        return rows;
    },

    create: async (data) => {
        const { tendonvi, hesoquydoi, mathuoc } = data;
        const sql = `INSERT INTO donvitinh (tendonvi, hesoquydoi, mathuoc) VALUES (?, ?, ?)`;
        const [result] = await db.query(sql, [tendonvi, hesoquydoi, mathuoc]);
        return result;
    },

    update: async (id, data) => {
        const { tendonvi, hesoquydoi, mathuoc } = data;
        const sql = `UPDATE donvitinh SET tendonvi = ?, hesoquydoi = ?, mathuoc = ? WHERE madonvitinh = ?`;
        const [result] = await db.query(sql, [tendonvi, hesoquydoi, mathuoc, id]);
        return result;
    },

    delete: async (id) => {
        const sql = 'DELETE FROM donvitinh WHERE madonvitinh = ?';
        const [result] = await db.query(sql, [id]);
        return result;
    }
};

module.exports = donvitinhModel;