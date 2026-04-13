import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaListUl, FaChartPie, FaSearch, FaChevronDown, FaChevronUp, FaUserCircle } from 'react-icons/fa';
import '../../css/admin-order.css';
import RevenueTab from './RevenueTab';

const AdminOrders = () => {
    const [activeTab, setActiveTab] = useState('approve');
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState({ total: 0, unviewed: 0, approved: 0, pending: 0 });
    const [expandedId, setExpandedId] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [processingIds, setProcessingIds] = useState([]); 

    const BASE_URL = 'https://harmony-api-t9h0.onrender.com';

    useEffect(() => { 
        fetchOrders(); 
    }, [filterStatus]);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${BASE_URL}/api/orders`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let allOrders = res.data;

            if (filterStatus) {
                allOrders = allOrders.filter(o => o.status === filterStatus);
            }

            setOrders(allOrders);

            const total = res.data.length;
            const pending = res.data.filter(o => o.status === 'pending').length;
            const approved = res.data.filter(o => o.status === 'approved' || o.status === 'completed').length;

            setStats({
                total: total,
                unviewed: pending, 
                approved: approved, 
                pending: pending
            });

        } catch (error) {
            console.error("Lỗi lấy đơn hàng:", error);
            setOrders([]);
        }
    };

    const handleStatus = async (id, status) => {
        const action = status === 'approved' ? 'duyệt' : 
                       status === 'rejected' ? 'từ chối' : 'hủy';
        
        if (!window.confirm(`Xác nhận ${action} đơn hàng này?`)) return;

        setProcessingIds(prev => [...prev, id]);

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${BASE_URL}/api/orders/${id}`, 
                { status }, 
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            fetchOrders(); 
            
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái:", error);
            alert("Lỗi khi cập nhật trạng thái");
        } finally {
            setProcessingIds(prev => prev.filter(pid => pid !== id));
        }
    };

    const isProcessing = (id) => processingIds.includes(id);

    const getImageUrl = (imagePath) => {
        const placeholder = "https://via.placeholder.com/100";
        if (!imagePath) return placeholder;
        let imgString = Array.isArray(imagePath) ? imagePath[0] : imagePath;
        if (!imgString || typeof imgString !== 'string') return placeholder;
        imgString = imgString.replace(/\\/g, '/');
        if (imgString.startsWith('http')) return imgString;
        return `${BASE_URL}${imgString.startsWith('/') ? imgString : '/' + imgString}`;
    };

    const formatCurrency = (amount) => {
        return (amount || 0).toLocaleString('vi-VN') + 'đ';
    };

    const filteredOrders = orders.filter(o => 
        (o.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (o._id || '').includes(searchTerm)
    );

    return (
        <div className="orders-page-container">
            {/* Tabs Điều hướng hiện đại */}
            <div className="modern-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'approve' ? 'tab-active' : ''}`} 
                    onClick={() => setActiveTab('approve')}
                >
                    <FaListUl className="tab-icon" /> Quản lý đơn hàng
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'revenue' ? 'tab-active' : ''}`} 
                    onClick={() => setActiveTab('revenue')}
                >
                    <FaChartPie className="tab-icon" /> Báo cáo doanh số
                </button>
            </div>

            {activeTab === 'approve' ? (
                <div className="orders-content-area">
                    
                    {/* Thống kê nhanh */}
                    <div className="order-stats-grid">
                        <div className={`order-stat-card stat-total ${filterStatus === '' ? 'active' : ''}`} onClick={() => setFilterStatus('')}>
                            <h3>Tổng đơn hàng</h3>
                            <h2>{stats.total}</h2>
                        </div>
                        <div className={`order-stat-card stat-pending ${filterStatus === 'pending' ? 'active' : ''}`} onClick={() => setFilterStatus('pending')}>
                            <h3>Cần xử lý</h3>
                            <h2>{stats.pending}</h2>
                        </div>
                        <div className={`order-stat-card stat-approved ${filterStatus === 'approved' ? 'active' : ''}`} onClick={() => setFilterStatus('approved')}>
                            <h3>Đã duyệt / Hoàn thành</h3>
                            <h2>{stats.approved}</h2>
                        </div>
                    </div>

                    {/* Tìm kiếm */}
                    <div className="order-toolbar">
                        <div className="search-wrapper">
                            <FaSearch className="search-icon" />
                            <input 
                                type="text" 
                                className="order-search"
                                placeholder="Tìm kiếm theo mã đơn hoặc tên khách hàng..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Danh sách đơn hàng */}
                    <div className="order-list-wrapper">
                        {filteredOrders.map((order, index) => (
                            <div key={order._id} className="order-item-card">
                                
                                {/* Header của Đơn hàng (Click để mở) */}
                                <div className="order-header-row" onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}>
                                    <div className="order-info-basic">
                                        <span className="order-index">#{index + 1}</span>
                                        <div className="order-customer-box">
                                            <span className="order-customer-name">{order.fullName}</span>
                                            {order.userId && <span className="member-badge"><FaUserCircle/> Thành viên</span>}
                                        </div>
                                    </div>
                                    <div className="order-status-actions">
                                        <span className={`badge badge-${order.status?.toLowerCase() || 'pending'}`}>
                                            {order.status === 'pending' ? '⏳ Chờ duyệt' : 
                                             order.status === 'approved' ? '✓ Đã duyệt' : 
                                             order.status === 'shipping' ? '🚚 Đang giao' : 
                                             order.status === 'completed' ? '✓ Hoàn thành' : 
                                             order.status === 'rejected' ? '✗ Đã từ chối' :
                                             order.status === 'cancelled' ? '✗ Đã hủy' : order.status}
                                        </span>
                                        <button className="order-toggle-btn">
                                            {expandedId === order._id ? <FaChevronUp /> : <FaChevronDown />}
                                        </button>
                                    </div>
                                </div>

                                {/* Nội dung chi tiết đơn hàng xổ xuống */}
                                {expandedId === order._id && (
                                    <div className="order-detail-content">
                                        <div className="detail-grid">
                                            <div className="info-section">
                                                <h4>Thông tin giao hàng</h4>
                                                <p><strong>Người nhận:</strong> {order.fullName}</p>
                                                <p><strong>Điện thoại:</strong> {order.phone}</p>
                                                <p><strong>Email:</strong> {order.email}</p>
                                                <p><strong>Địa chỉ:</strong> {order.address}</p>
                                                <p><strong>Ngày đặt:</strong> {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
                                            </div>
                                            
                                            <div className="info-section bg-gray">
                                                <h4>Thông tin tài khoản</h4>
                                                {order.userId ? (
                                                    <p><strong>Mã User:</strong> {order.userId._id || order.userId}</p>
                                                ) : (
                                                    <p className="guest-text">Khách vãng lai (Mua không cần tài khoản)</p>
                                                )}
                                                <p style={{marginTop: '10px'}}><strong>Ghi chú:</strong> {order.notes || 'Không có ghi chú'}</p>
                                            </div>
                                        </div>
                          
                                        {/* Bảng sản phẩm */}
                                        <div className="table-responsive">
                                            <table className="inner-order-table">
                                                <thead>
                                                    <tr>
                                                        <th width="10%">Ảnh</th>
                                                        <th width="40%">Tên sản phẩm</th>
                                                        <th width="15%" className="text-center">Số lượng</th>
                                                        <th width="15%" className="text-right">Đơn giá</th>
                                                        <th width="20%" className="text-right">Thành tiền</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {order.items.map((item, idx) => {
                                                        const prodImg = item.image || item.images || item.productId?.images || item.productId?.image;
                                                        const price = item.price || 0;
                                                        return (
                                                            <tr key={idx}>
                                                                <td>
                                                                    <img src={getImageUrl(prodImg)} alt={item.name} className="product-mini-img" />
                                                                </td>
                                                                <td className="fw-bold">{item.name || item.productId?.name}</td>
                                                                <td className="text-center">x{item.quantity}</td>
                                                                <td className="text-right">{formatCurrency(price)}</td>
                                                                <td className="text-right fw-bold text-teal">
                                                                    {formatCurrency(price * item.quantity)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="total-price-row">
                                            <span>Tổng thanh toán:</span> 
                                            <span className="total-amount">{formatCurrency(order.totalAmount)}</span>
                                        </div>

                                        {/* Nút chức năng */}
                                        <div className="order-actions">
                                            {order.status === 'pending' ? (
                                                <>
                                                    <button 
                                                        className="btn-action btn-approve" 
                                                        onClick={() => handleStatus(order._id, 'approved')}
                                                        disabled={isProcessing(order._id)}
                                                    >
                                                        {isProcessing(order._id) ? 'Đang xử lý...' : 'Duyệt đơn hàng'}
                                                    </button>
                                                    <button 
                                                        className="btn-action btn-reject" 
                                                        onClick={() => handleStatus(order._id, 'rejected')}
                                                        disabled={isProcessing(order._id)}
                                                    >
                                                        {isProcessing(order._id) ? 'Đang xử lý...' : 'Từ chối'}
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="status-message">
                                                    {order.status === 'completed' ? 'Đơn hàng đã được giao thành công' : 'Đơn hàng đã được xử lý'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {filteredOrders.length === 0 && (
                            <div className="empty-state">
                                <h3>Không tìm thấy đơn hàng nào</h3>
                                <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <RevenueTab />
            )}
        </div>
    );
};

export default AdminOrders;
