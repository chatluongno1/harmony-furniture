import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Truy cập bị từ chối. Vui lòng đăng nhập!" });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        req.user = verified; 
        next();
    } catch (error) {
        return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn!" });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ message: "Chỉ Admin mới có quyền thực hiện thao tác này!" });
    }
};