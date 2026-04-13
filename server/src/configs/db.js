import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

class Database {
    async connect() {
        const uri = process.env.MONGO_URI;
        
        if (!uri) {
            console.error('❌ Lỗi: Chưa tìm thấy MONGO_URI trong file .env');
            process.exit(1);
        }

        try {
            // Tối ưu hóa connection options
            const options = {
                maxPoolSize: 10,
                minPoolSize: 5,
                maxIdleTimeMS: 45000,
                socketTimeoutMS: 45000,
                serverSelectionTimeoutMS: 5000,
                retryWrites: true,
                w: 'majority'
            };

            await mongoose.connect(uri, options);
            console.log('✅ Database: Connected');

            // Lắng nghe sự kiện rớt mạng
            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️ Database: Disconnected');
            });

            mongoose.connection.on('reconnected', () => {
                console.log('🔄 Database: Reconnected');
            });

        } catch (err) {
            console.error('❌ Database Error:', err.message);
            process.exit(1);
        }
    }
}

export default new Database();