import express from 'express';
import OrderController from '../controllers/OrderController.js';
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const optionalAuth = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        try {
            const verified = jwt.verify(token, process.env.JWT_SECRET);
            req.user = verified;
        } catch (error) {
            req.user = null;
        }
    }
    next();
};

// --- NHÓM ROUTE CHO NGƯỜI DÙNG ---
router.post('/create', optionalAuth, OrderController.createOrder);
router.get('/my-orders', verifyToken, OrderController.getUserOrders);
router.patch('/received/:orderId', verifyToken, OrderController.markAsReceived);

// --- NHÓM ROUTE CHO ADMIN ---
// Lấy toàn bộ đơn hàng
router.get('/', verifyToken, isAdmin, OrderController.getAllOrders); 

// Lấy số liệu thống kê doanh số
router.get('/revenue-stats', verifyToken, isAdmin, OrderController.getRevenueStats);

// Cập nhật trạng thái/Duyệt đơn
router.put('/:id', verifyToken, isAdmin, OrderController.updateStatus);

// Xóa hóa đơn/đơn hàng
router.delete('/:id', verifyToken, isAdmin, OrderController.deleteOrder);

export default router;