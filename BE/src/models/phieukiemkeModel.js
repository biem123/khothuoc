const db = require('../configs/db');

const phieukiemkeModel = {
    getAll: async () => {
        const sql = 'SELECT * FROM phieukiemke ORDER BY ngaykiemke DESC';
        const [rows] = await db.query(sql);
        return rows;
    },
    getById: async (maphieu) => {
        const sql = 'SELECT * FROM phieukiemke WHERE maphieu = ?';
        const [rows] = await db.query(sql, [maphieu]);
        return rows;
    },
    create: async (data) => {
        const { maphieu, ngaykiemke, nguoitao, trangthai } = data;
        const sql = `INSERT INTO phieukiemke (maphieu, ngaykiemke, nguoitao, trangthai) VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(sql, [maphieu, ngaykiemke || new Date(), nguoitao, trangthai || 'Draft']);
        return result;
    },
    updateTrangThai: async (maphieu, trangthai) => {
        const sql = `UPDATE phieukiemke SET trangthai = ? WHERE maphieu = ?`;
        const [result] = await db.query(sql, [trangthai, maphieu]);
        return result;
    },
    delete: async (maphieu) => {
        const sql = 'DELETE FROM phieukiemke WHERE maphieu = ?';
        const [result] = await db.query(sql, [maphieu]);
        return result;
    }
};
module.exports = phieukiemkeModel;