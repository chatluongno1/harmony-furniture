import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        subject: { type: String, default: 'Hỗ trợ khách hàng' },
        message: { type: String, required: true },
        status: { type: String, enum: ['pending', 'resolved'], default: 'pending' }
    },
    { timestamps: true }
);

const Contact = mongoose.model('Contact', contactSchema);
export default Contact;