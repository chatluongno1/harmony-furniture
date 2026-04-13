import Contact from '../models/Contact.js';
import nodemailer from 'nodemailer'; // Thêm thư viện gửi mail
import process from 'process';

class ContactController {
    async submitContact(req, res) {
        try {
            const { fullName, phone, email, message } = req.body;

            // Kiểm tra dữ liệu đầu vào
            if (!fullName || !phone || !email || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ các trường: họ tên, số điện thoại, email và nội dung.'
                });
            }

            // 1. Lưu thông tin vào Database (Giữ nguyên)
            await Contact.create({
                fullName,
                phone,
                email,
                message
            });

            // 2. Cấu hình và Gửi Email qua Nodemailer
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER, // phannguyenhuyan@gmail.com
                    pass: process.env.EMAIL_PASS, // Mật khẩu ứng dụng 16 ký tự
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER, // Gửi đến chính email của shop để nhận thông báo
                replyTo: email,             // Để khi bạn nhấn Reply sẽ gửi lại cho email khách hàng
                subject: `[Harmony Furniture] Có liên hệ mới từ ${fullName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                        <h3 style="color: #008080;">Thông tin liên hệ từ Website Harmony Furniture</h3>
                        <p><strong>Họ và Tên:</strong> ${fullName}</p>
                        <p><strong>Số điện thoại:</strong> ${phone}</p>
                        <p><strong>Email khách hàng:</strong> ${email}</p>
                        <hr style="border: 1px solid #eee;" />
                        <p><strong>Nội dung tin nhắn:</strong></p>
                        <p style="background: #f9f9f9; padding: 15px; border-radius: 5px;">${message}</p>
                    </div>
                `,
            };

            await transporter.sendMail(mailOptions);

            // 3. Trả về thành công sau khi cả DB và Email đều OK
            return res.status(201).json({
                success: true,
                message: 'Cảm ơn bạn! Tin nhắn của bạn đã được gửi đến shop.'
            });

        } catch (error) {
            console.error('❌ Lỗi ở API Contact:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống hoặc lỗi gửi email, vui lòng thử lại sau.'
            });
        }
    }

    async getAllContacts(req, res) {
        try {
            const contacts = await Contact.find().sort({ createdAt: -1 });
            res.status(200).json(contacts);
        } catch (error) {
            res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
        }
    }

    async deleteContact(req, res) {
        try {
            await Contact.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: 'Xóa tin nhắn thành công!' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi xóa', error: error.message });
        }
    }
}

export default new ContactController();