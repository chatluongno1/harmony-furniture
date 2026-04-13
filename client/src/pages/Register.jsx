import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUserCircle, FaArrowLeft } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/auth.css';

const Register = () => {
    // Địa chỉ API local
    const API_URL = "http://localhost:5000/api/auth";

    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    
    const [errors, setErrors] = useState({});
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const validate = () => {
        let newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ và tên";
        if (!formData.username.trim()) newErrors.username = "Vui lòng nhập username";
        if (!formData.email.trim()) {
            newErrors.email = "Vui lòng nhập email";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email không đúng định dạng";
        }
        if (!formData.password) {
            newErrors.password = "Vui lòng nhập mật khẩu";
        } else if (formData.password.length < 6) {
            newErrors.password = "Mật khẩu tối thiểu 6 ký tự";
        }
        if (formData.confirmPassword !== formData.password) {
            newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        }
        if (!confirmed) newErrors.confirmed = "Bạn cần xác nhận thông tin";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- HÀM ĐĂNG KÝ (Đã đổi sang API Render) ---
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await axios.post(`${API_URL}/register`, { ...formData });
            toast.success("Đăng ký thành công!");
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi đăng ký!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ha-auth-bg">
            <div className="ha-auth-overlay"></div>
            <ToastContainer position="top-center" autoClose={2000} />
            <div className="ha-auth-card">
                <Link to="/" className="ha-back-link"><FaArrowLeft /> Trở về</Link>
                <div className="ha-auth-header">
                    <div className="ha-icon-circle"><FaUserCircle /></div>
                    <h2>ĐĂNG KÝ</h2>
                </div>

                <form className="ha-auth-form" onSubmit={handleRegister}>
                    <div className={`ha-input-group ${errors.fullName ? 'has-error' : ''}`}>
                        <label>Họ & tên</label>
                        <input type="text" name="fullName" placeholder="Nhập họ và tên" value={formData.fullName} onChange={handleChange} />
                        {errors.fullName && <span className="error-msg">{errors.fullName}</span>}
                    </div>

                    <div className={`ha-input-group ${errors.username ? 'has-error' : ''}`}>
                        <label>Username</label>
                        <input type="text" name="username" placeholder="Nhập username" value={formData.username} onChange={handleChange} />
                        {errors.username && <span className="error-msg">{errors.username}</span>}
                    </div>

                    <div className={`ha-input-group ${errors.email ? 'has-error' : ''}`}>
                        <label>Email</label>
                        <input 
                            type="email" 
                            name="email" 
                            placeholder="Nhập email" 
                            value={formData.email} 
                            onChange={handleChange} 
                        />
                        {errors.email && <span className="error-msg">{errors.email}</span>}
                    </div>

                    <div className={`ha-input-group ${errors.password ? 'has-error' : ''}`}>
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Nhập mật khẩu"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        {errors.password && <span className="error-msg">{errors.password}</span>}
                    </div>

                    <div className={`ha-input-group ${errors.confirmPassword ? 'has-error' : ''}`}>
                        <label>Nhập lại mật khẩu</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Nhập lại mật khẩu"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                        {errors.confirmPassword && <span className="error-msg">{errors.confirmPassword}</span>}
                    </div>

                    <div className="ha-checkbox-wrapper">
                        <label className="ha-checkbox-label">
                            <input type="checkbox" checked={confirmed} onChange={e => {setConfirmed(e.target.checked); setErrors({...errors, confirmed: ''})}} />
                            <span>Tôi xác nhận thông tin chính xác</span>
                        </label>
                        {errors.confirmed && <span className="error-msg">{errors.confirmed}</span>}
                    </div>

                    <button type="submit" className="ha-btn-primary" disabled={loading}>
                        {loading ? "ĐANG XỬ LÝ..." : "ĐĂNG KÝ"}
                    </button>
                    
                    <div className="ha-auth-footer">
                        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;