import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserCircle } from 'react-icons/fa';
import '../../css/profile.css';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Profile = () => {
    const [data, setData] = useState({ user: {}, orderHistory: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({});
    const [selectedFile, setSelectedFile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const res = await axios.get('https://harmony-api-t9h0.onrender.com/api/users/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
            setFormData(res.data.user || {});
        } catch (error) {
            console.error('Lỗi khi lấy profile:', error.response?.data || error.message);
            const status = error.response?.status;
            if (status === 400 || status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const form = new FormData();
        Object.keys(formData).forEach(key => form.append(key, formData[key]));
        if (selectedFile) form.append('avatar', selectedFile);

        try {
            await axios.put('https://harmony-api-t9h0.onrender.com/api/users/profile', form, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Cập nhật thông tin thành công!");
            
            const res = await axios.get('https://harmony-api-t9h0.onrender.com/api/users/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            localStorage.setItem('user', JSON.stringify(res.data.user));
            
            setIsModalOpen(false);
            fetchProfile();
            // Reload để Header cập nhật lại ảnh mới nhất
            setTimeout(() => window.location.reload(), 1500); 
        } catch (error) {
            toast.error("Lỗi cập nhật! Vui lòng thử lại.");
        }
    };

    // ✅ FIX: Xử lý dấu gạch chéo ngược của Windows để ảnh luôn hiển thị
    const getImageUrl = (imagePath, type = 'product') => {
        const placeholder = type === 'avatar' 
            ? "https://placehold.co/200x200/046A62/FFFFFF?text=User" 
            : "https://placehold.co/80x80/046A62/FFFFFF?text=Harmony";
            
        if (!imagePath) return placeholder;
        let imgString = Array.isArray(imagePath) ? imagePath[0] : imagePath;
        if (!imgString) return placeholder;

        // Xử lý chống vỡ ảnh trên môi trường Windows
        imgString = imgString.replace(/\\/g, '/');

        if (imgString.startsWith('http')) return imgString;
        const formattedPath = imgString.startsWith('/') ? imgString : `/${imgString}`;
        return `https://harmony-api-t9h0.onrender.com${formattedPath}`;
    };

    const { user, orderHistory } = data;

    return (
        <div className="profile-page">
            <ToastContainer position="top-center" autoClose={2000} />
            <div className="profile-container">
                {/* Bên trái: Avatar */}
                <div className="profile-left">
                    <div className="avatar-wrapper">
                        {user.avatar ? (
                            <img 
                                src={getImageUrl(user.avatar, 'avatar')} 
                                alt="Avatar" 
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "https://placehold.co/200x200/046A62/FFFFFF?text=User";
                                }}
                            />
                        ) : (
                            <FaUserCircle className="default-avatar" />
                        )}
                    </div>
                </div>

                {/* Bên phải: Thông tin */}
                <div className="profile-right">
                    <h2>Hồ sơ của tôi</h2>
                    <div className="info-grid">
                        <p><strong>Họ & Tên:</strong> {user.fullName || 'Chưa cập nhật'}</p>
                        <p><strong>Email:</strong> {user.email || 'Chưa cập nhật'}</p>
                        <p><strong>Username:</strong> {user.username}</p>
                        <p><strong>Role:</strong> <span className="role-badge">{user.role}</span></p>
                        <p><strong>Số điện thoại:</strong> {user.phoneNumber || 'Chưa cập nhật'}</p>
                        <p><strong>Địa chỉ:</strong> {user.address || 'Chưa cập nhật'}</p>
                    </div>
                    <button className="btn-edit" onClick={() => setIsModalOpen(true)}>Chỉnh sửa hồ sơ</button>
                </div>
            </div>

            {/* Lịch sử mua hàng */}
            {user.role === 'user' && (
                <div className="order-history">
                    <h2>Lịch sử mua hàng</h2>
                    {orderHistory.length > 0 ? (
                        <div className="table-responsive">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th style={{width: '15%'}}>Mã Đơn</th>
                                        <th style={{width: '40%'}}>Sản phẩm</th>
                                        <th style={{width: '15%'}}>Tổng tiền</th>
                                        <th style={{width: '15%'}}>Ngày mua</th>
                                        <th style={{width: '15%'}}>Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderHistory.map((order) => (
                                        <tr key={order._id}>
                                            <td className="text-center font-bold">
                                                #{order._id.substring(order._id.length - 6).toUpperCase()}
                                            </td>
                                            <td>
                                                {order.items.map(item => {
                                                    const prodName = item.name || item.productId?.name || item.product?.name || "Sản phẩm Harmony";
                                                    const prodImg = item.image || item.productId?.images?.[0] || item.productId?.image || item.product?.images?.[0] || item.product?.image;

                                                    return (
                                                        <div key={item.productId?._id || item.productId || Math.random()} className="history-item">
                                                            <img 
                                                                src={getImageUrl(prodImg, 'product')} 
                                                                alt={prodName}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = "https://placehold.co/80x80/046A62/FFFFFF?text=Harmony";
                                                                }}
                                                            />
                                                            <div className="history-item-details">
                                                                <span className="history-item-name">{prodName}</span>
                                                                <span className="history-item-qty">x {item.quantity}</span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </td>
                                            <td className="total text-right">{(order.totalAmount || 0).toLocaleString()} Đ</td>
                                            <td className="text-center">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
                                            <td className="text-center">
                                                <span className={`status-badge ${order.status === 'Delivered' ? 'delivered' : 'processing'}`}>
                                                    {order.status === 'Delivered' ? 'Đã giao' : 'Đang xử lý'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="no-data-box">
                            <p className="no-data">Bạn chưa có đơn hàng nào.</p>
                            <button className="btn-shop-now" onClick={() => navigate('/products')}>Mua sắm ngay</button>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Cập nhật */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Cập nhật thông tin</h2>
                        <form onSubmit={handleUpdate}>
                            <div className="form-group">
                                <label>Username (Không thể đổi)</label>
                                <input type="text" value={formData.username} disabled className="input-disabled" />
                            </div>
                            <div className="form-group">
                                <label>Mật khẩu mới (Để trống nếu không đổi)</label>
                                <input type="password" placeholder="Nhập mật khẩu mới..." onChange={e => setFormData({...formData, password: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Họ & Tên</label>
                                <input type="text" value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Số điện thoại</label>
                                <input type="text" value={formData.phoneNumber || ''} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Địa chỉ</label>
                                <textarea rows="3" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Ảnh đại diện (Avatar)</label>
                                <input type="file" className="file-input" onChange={e => setSelectedFile(e.target.files[0])} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn-save">Lưu thay đổi</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
