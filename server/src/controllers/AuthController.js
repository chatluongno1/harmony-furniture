import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

class AuthController {

    // ĐĂNG KÝ
    async register(req, res) {
        try {
            const { email, username, fullName, password } = req.body;

            if (!email || !username || !fullName || !password) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Vui lòng nhập đầy đủ: email, username, họ tên và mật khẩu'
                });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Mật khẩu phải có ít nhất 6 ký tự'
                });
            }

            const cleanEmail = email.toLowerCase().trim();
            const cleanUsername = username.trim();
            const cleanFullName = fullName.trim();

            const userExists = await User.findOne({ $or: [{ email: cleanEmail }, { username: cleanUsername }] });
            if (userExists) {
                return res.status(409).json({
                    status: 'error',
                    message: 'Email hoặc username này đã được đăng ký'
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                email: cleanEmail,
                username: cleanUsername,
                fullName: cleanFullName,
                password: hashedPassword,
                role: 'user'
            });

            await newUser.save();

            return res.status(201).json({
                status: 'success',
                message: 'Đăng ký thành công'
            });

        } catch (error) {
            console.error('Lỗi register:', error.message);
            return res.status(500).json({
                status: 'error',
                message: 'Lỗi máy chủ'
            });
        }
    }

    // BƯỚC 2: ĐĂNG NHẬP
    async login(req, res) {
        try {
            const { email, username, password } = req.body;
            const identifier = (email || username || '').trim();

            if (!identifier || !password) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Vui lòng nhập email/username và mật khẩu'
                });
            }

            const isEmail = identifier.includes('@');
            const query = isEmail
                ? { email: identifier.toLowerCase() }
                : { $or: [ { username: identifier }, { email: identifier.toLowerCase() } ] };

            const user = await User.findOne(query);

            if (!user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Tên đăng nhập/email hoặc mật khẩu không chính xác'
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Email hoặc mật khẩu không chính xác'
                });
            }

            const token = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            const { password: _, ...userWithoutPassword } = user.toObject();
            return res.status(200).json({
                status: 'success',
                token,
                user: userWithoutPassword
            });

        } catch (error) {
            console.error('Lỗi login:', error.message);
            return res.status(500).json({
                status: 'error',
                message: 'Lỗi máy chủ'
            });
        }
    }

    // CẬP NHẬT PROFILE
    updateProfile = async (req, res) => {
        try {
            const userId = req.user.id || req.user._id;
            const { fullName, phoneNumber, address } = req.body;

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({
                status: 'error',
                message: 'Người dùng không tồn tại'
            });

            if (fullName) user.fullName = fullName.trim();
            if (phoneNumber) user.phoneNumber = phoneNumber.trim();
            if (address) user.address = address.trim();

            await user.save();
            const { password: _, ...userWithoutPassword } = user.toObject();

            return res.status(200).json({
                status: 'success',
                message: 'Cập nhật thành công',
                user: userWithoutPassword
            });

        } catch (error) {
            console.error('Lỗi updateProfile:', error.message);
            return res.status(500).json({
                status: 'error',
                message: 'Lỗi máy chủ'
            });
        }
    };
}

export default new AuthController();