import express from 'express';
import compression from 'compression';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import 'dotenv/config'; 

// Import cấu hình DB
import db from './src/configs/db.js'; 

// Import Routes
import productRoutes from './src/routes/productRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import cartRoutes from './src/routes/cartRoutes.js';
import categoryRoutes from './src/routes/categoryRoutes.js';
import contactRoutes from './src/routes/contactRoutes.js';
import invoiceRoutes from './src/routes/InvoiceRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import userRoutes from './src/routes/userRoutes.js'; 

const app = express();
// Render sẽ tự cấp PORT, nếu không có thì dùng 5000 (đồng bộ với Dashboard của bạn)
const PORT = process.env.PORT || 5000; 

// Cấu hình __dirname cho ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- TỰ ĐỘNG TẠO THƯ MỤC UPLOADS NẾU THIẾU ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// --- FIX LỖI DATABASE/KẾT NỐI: CẤU HÌNH CORS TRIỆT ĐỂ ---
app.use(cors({
    // Cho phép tất cả các nguồn truy cập để thiết bị khác không bị chặn
    origin: true, 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression()); // Gzip compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// PHỤC VỤ FILE TĨNH
const staticOptions = {
    maxAge: '1d',
    etag: false
};
app.use('/uploads', express.static(uploadDir, staticOptions));
app.use(express.static(path.join(__dirname, 'public'), staticOptions));

// --- CÁC ĐƯỜNG DẪN API ---
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes); 

// Route mặc định
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: '✅ Harmony Furniture API is running!',
    });
});

// Xử lý lỗi 404
app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'API Endpoint không tồn tại' });
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error('🔥 LỖI HỆ THỐNG:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống Server!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// --- KHỞI CHẠY ---
db.connect().then(() => {
    app.listen(PORT, () => {
        console.log('--------------------------------------');
        console.log('✅ DATABASE: Kết nối thành công');
        console.log(`🚀 SERVER: Chạy tại port ${PORT}`);
        console.log('--------------------------------------');
    });
}).catch(err => {
    console.error('❌ Lỗi khởi động:', err.message);
    process.exit(1);
});