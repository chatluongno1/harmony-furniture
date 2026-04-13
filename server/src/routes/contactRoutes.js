import express from 'express';
import ContactController from '../controllers/ContactController.js';
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';

// Chúng ta sẽ phân quyền: ai cũng có thể gửi tin nhắn, nhưng chỉ Admin mới có thể xem và xóa.

const router = express.Router();

// Route cho User (Gửi tin nhắn -> Lưu DB & Gửi Email)
router.post('/send', ContactController.submitContact);
router.post('/', ContactController.submitContact);

// Route cho Admin (Bảo vệ bởi Middleware chống xâm nhập)
router.get('/all', verifyToken, isAdmin, ContactController.getAllContacts);
router.delete('/delete/:id', verifyToken, isAdmin, ContactController.deleteContact);

export default router;