const db = require('../configs/db');

const donhangModel = {
    // 1. Lấy tất cả đơn hàng (Kèm tên đối tác)
    getAll: async () => {
        const sql = `SELECT dh.*, dt.tendoitac 
                     FROM donhang dh 
                     LEFT JOIN doitac dt ON dh.madoitac = dt.madoitac 
                     ORDER BY dh.ngaytao DESC`;
        const [rows] = await db.query(sql);
        return rows;
    },

    // 2. Lấy chi tiết 1 đơn hàng theo ID
    getById: async (id) => {
        const sql = `SELECT dh.*, dt.tendoitac 
                     FROM donhang dh 
                     LEFT JOIN doitac dt ON dh.madoitac = dt.madoitac 
                     WHERE dh.madonhang = ?`;
        const [rows] = await db.query(sql, [id]);
        return rows;
    },

    // 3. Lọc đơn hàng theo Loại (Nhap / Xuat)
    getByLoai: async (loaidonhang) => {
        const sql = `SELECT dh.*, dt.tendoitac 
                     FROM donhang dh 
                     LEFT JOIN doitac dt ON dh.madoitac = dt.madoitac 
                     WHERE dh.loaidonhang = ? 
                     ORDER BY dh.ngaytao DESC`;
        const [rows] = await db.query(sql, [loaidonhang]);
        return rows;
    },

    // 4. Tạo đơn hàng mới
    create: async (data) => {
        const { madoitac, mataikhoan, loaidonhang, sohoadongtgt, mavandon3pl, trangthai, tonggiatri, tienchietkhau, tiendathanhtoan } = data;
        
        // Nếu không truyền ngày tạo, tự động lấy ngày giờ hiện tại của server
        const ngaytao = data.ngaytao || new Date().toISOString().slice(0, 19).replace('T', ' ');

        const sql = `INSERT INTO donhang 
                    (madoitac, mataikhoan, loaidonhang, sohoadongtgt, mavandon3pl, trangthai, ngaytao, tonggiatri, tienchietkhau, tiendathanhtoan) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [
            madoitac, mataikhoan, loaidonhang, 
            sohoadongtgt || null, mavandon3pl || null, 
            trangthai || 'choduyet', ngaytao, 
            tonggiatri || 0, tienchietkhau || 0, tiendathanhtoan || 0
        ]);
        return result;
    },

    // 5. Cập nhật TRẠNG THÁI đơn hàng (Riêng biệt để an toàn)
    updateStatus: async (id, trangthai) => {
        const sql = `UPDATE donhang SET trangthai = ? WHERE madonhang = ?`;
        const [result] = await db.query(sql, [trangthai, id]);
        return result;
    },

    // 6. Cập nhật toàn bộ thông tin đơn hàng (Chỉ nên cho phép khi đang 'choduyet')
    update: async (id, data) => {
        const { madoitac, sohoadongtgt, mavandon3pl, tonggiatri, tienchietkhau, tiendathanhtoan } = data;
        const sql = `UPDATE donhang 
                     SET madoitac=?, sohoadongtgt=?, mavandon3pl=?, tonggiatri=?, tienchietkhau=?, tiendathanhtoan=? 
                     WHERE madonhang = ?`;
        const [result] = await db.query(sql, [madoitac, sohoadongtgt, mavandon3pl, tonggiatri, tienchietkhau, tiendathanhtoan, id]);
        return result;
    },

    // 7. Xóa đơn hàng (Thực tế ít dùng, thường dùng Hủy đơn)
    delete: async (id) => {
        const sql = 'DELETE FROM donhang WHERE madonhang = ?';
        const [result] = await db.query(sql, [id]);
        return result;
    }
};

module.exports = donhangModel;