const db = require('../configs/db');

const chitietdonhangModel = {
    // 1. Lấy danh sách chi tiết của MỘT ĐƠN HÀNG (Kèm tên thuốc)
    getByDonHangId: async (madonhang) => {
        const sql = `SELECT ct.*, t.tenthuoc 
                     FROM chitietdonhang ct
                     LEFT JOIN thuoc t ON ct.mathuoc = t.mathuoc
                     WHERE ct.madonhang = ?
                     ORDER BY ct.mactdh ASC`;
        const [rows] = await db.query(sql, [madonhang]);
        return rows;
    },

    // 2. Lấy 1 dòng chi tiết cụ thể (dùng khi cần sửa 1 dòng)
    getById: async (id) => {
        const sql = 'SELECT * FROM chitietdonhang WHERE mactdh = ?';
        const [rows] = await db.query(sql, [id]);
        return rows;
    },

    // 3. Thêm MỚI một dòng chi tiết thuốc vào đơn hàng
    create: async (data) => {
        const { madonhang, mathuoc, malo, madonvitinh, soluongyeucau, soluongthucte, dongia, phantramchietkhau } = data;
        const sql = `INSERT INTO chitietdonhang 
                    (madonhang, mathuoc, malo, madonvitinh, soluongyeucau, soluongthucte, dongia, phantramchietkhau) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [
            madonhang, mathuoc, malo, madonvitinh, 
            soluongyeucau, soluongthucte || 0, // Mặc định số thực tế ban đầu = 0
            dongia || 0, phantramchietkhau || 0
        ]);
        return result;
    },

    // 4. Cập nhật chi tiết (Ví dụ: Cập nhật lại số lượng thực tế sau khi đếm hàng)
    update: async (id, data) => {
        const { mathuoc, malo, madonvitinh, soluongyeucau, soluongthucte, dongia, phantramchietkhau } = data;
        const sql = `UPDATE chitietdonhang 
                     SET mathuoc=?, malo=?, madonvitinh=?, soluongyeucau=?, soluongthucte=?, dongia=?, phantramchietkhau=? 
                     WHERE mactdh = ?`;
        const [result] = await db.query(sql, [
            mathuoc, malo, madonvitinh, soluongyeucau, soluongthucte, dongia, phantramchietkhau, id
        ]);
        return result;
    },

    // 5. Xóa 1 dòng chi tiết (Khi khách không muốn mua món này nữa)
    delete: async (id) => {
        const sql = 'DELETE FROM chitietdonhang WHERE mactdh = ?';
        const [result] = await db.query(sql, [id]);
        return result;
    }
};

module.exports = chitietdonhangModel;