import Contact from '../models/Contact.js';

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

            // 1. Lưu thông tin vào Database
            await Contact.create({
                fullName,
                phone,
                email,
                message
            });

            // 2. Trả về thành công (không gửi email)
            return res.status(201).json({
                success: true,
                message: 'Cảm ơn bạn! Tin nhắn của bạn đã được gửi đến shop.'
            });

        } catch (error) {
            console.error('❌ Lỗi ở API Contact:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi hệ thống, vui lòng thử lại sau.'
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