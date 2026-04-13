import express from 'express';
import userController from '../controllers/UserController.js';
import { verifyToken, isAdmin } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// --- USER ROUTES ---
router.get('/profile', verifyToken, userController.getProfile);
router.put('/profile', verifyToken, upload.single('avatar'), userController.updateProfile);
router.get('/:userId/history', verifyToken, userController.getPurchaseHistory || userController.getProfile);

// --- ADMIN ROUTES ---
router.get('/', verifyToken, isAdmin, userController.getAllUsers);
router.put('/:id/role', verifyToken, isAdmin, userController.updateUserRole);
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);

export default router;