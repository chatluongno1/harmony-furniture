import User from '../models/User.js';
import Order from '../models/Order.js';
import fs from 'fs';
import path from 'path';

class UserController {
    // 1. Lấy Profile cá nhân & Lịch sử mua hàng (ĐÃ FIX POPULATE)
    getProfile = async (req, res) => {
        try {
            const userId = req.user.id || req.user._id;
            const user = await User.findById(userId).select('-password');
            
            // ✅ FIX LỖI: Thêm .populate() để kéo tên và ảnh sản phẩm từ Database
            const orderHistory = await Order.find({ userId })
                .populate({
                    path: 'items.productId',
                    select: 'name images image price category' // Lấy thông tin cần thiết
                })
                .sort({ createdAt: -1 });
                
            res.status(200).json({ user, orderHistory });
        } catch (error) {
            res.status(500).json({ message: "Lỗi lấy profile", error: error.message });
        }
    };

    // 2. Cập nhật Profile (Xử lý cả Avatar và xóa ảnh cũ)
    updateProfile = async (req, res) => {
        try {
            const userId = req.user.id || req.user._id;
            const { fullName, email, phoneNumber, address } = req.body;
            
            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

            let updateData = { 
                fullName: fullName?.trim(), 
                email: email?.toLowerCase().trim(), 
                phoneNumber: phoneNumber?.trim(), 
                address: address?.trim() 
            };

            // Deep Logic: Xử lý file ảnh mới và dọn dẹp ảnh cũ
            if (req.file) {
                const oldAvatar = user.avatar;
                updateData.avatar = `/uploads/${req.file.filename}`;
                
                // Nếu đã có ảnh cũ, tiến hành xóa file vật lý trên server
                if (oldAvatar && oldAvatar.startsWith('/uploads/')) {
                    const oldFilename = path.basename(oldAvatar);
                    const oldFilePath = path.join(process.cwd(), 'uploads', oldFilename);
                    
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlink(oldFilePath, (err) => {
                            if (err) console.warn('⚠️ Không xóa được ảnh cũ:', err.message);
                        });
                    }
                }
            }

            const updatedUser = await User.findByIdAndUpdate(
                userId, 
                { $set: updateData }, 
                { returnDocument: 'after', runValidators: true } // ✅ Đã fix cảnh báo mongoose (bỏ new: true)
            ).select('-password');

            res.status(200).json({ success: true, message: "Cập nhật thành công!", user: updatedUser });
        } catch (error) {
            res.status(500).json({ message: "Lỗi cập nhật", error: error.message });
        }
    };

    // 3. Admin: Lấy danh sách toàn bộ User
    getAllUsers = async (req, res) => {
        try {
            const users = await User.find().select('-password').sort({ createdAt: -1 });
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
        }
    };

    // 4. Admin: Cập nhật vai trò
    updateUserRole = async (req, res) => {
        try {
            const { id } = req.params;
            const { role } = req.body;
            const user = await User.findByIdAndUpdate(
                id, 
                { role }, 
                { returnDocument: 'after' } // ✅ Đã fix cảnh báo mongoose (bỏ new: true)
            ).select('-password');
            res.status(200).json({ success: true, user });
        } catch (error) {
            res.status(400).json({ message: "Lỗi cập nhật vai trò", error: error.message });
        }
    };

    // 5. Admin: Xóa User (Chặn xóa Admin khác)
    deleteUser = async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) return res.status(404).json({ message: "User không tồn tại" });
            if (user.role === 'admin') return res.status(403).json({ message: "Bảo mật: Không thể xóa tài khoản Admin" });
            
            await User.findByIdAndDelete(id);
            res.status(200).json({ success: true, message: "Đã xóa người dùng vĩnh viễn" });
        } catch (error) {
            res.status(500).json({ message: "Lỗi xóa user", error: error.message });
        }
    };

    // 6. Lấy lịch sử mua hàng (ĐÃ FIX POPULATE ĐỀ PHÒNG)
    getPurchaseHistory = async (req, res) => {
        try {
            const userId = req.params.userId || req.user.id;
            const history = await Order.find({ userId })
                .populate({
                    path: 'items.productId',
                    select: 'name images image price category' // ✅ Kéo thông tin ảnh/tên
                })
                .sort({ createdAt: -1 });
            res.status(200).json(history);
        } catch (error) {
            res.status(500).json({ message: "Lỗi lấy lịch sử" });
        }
    };
}

export default new UserController();