import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logoHarmony from '../../assets/images/Logo_Hamory.png';
import '../../css/checkout.css';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const products = useMemo(() => location.state?.products || [], [location.state]);
    
    const [isOrdering, setIsOrdering] = useState(false);
    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || {};
        } catch (e) { return {}; }
    }, []);
    const token = localStorage.getItem('token');

    const [shippingInfo, setShippingInfo] = useState({
        fullName: user.fullName || '',
        phone: user.phoneNumber || '',
        email: user.email || '',
        province: '', 
        district: '',
        addressDetail: ''
    });

    useEffect(() => {
        if (products.length === 0) {
            navigate('/cart');
            return;
        }
        window.scrollTo(0, 0);
    }, [products, navigate]);

    const stats = useMemo(() => {
        const sub = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
        const dis = products.reduce((acc, p) => acc + ((p.price * (p.discount || 0) / 100) * p.quantity), 0);
        return { sub, dis, final: sub - dis };
    }, [products]);

    const getImageUrl = (imgData) => {
        const placeholder = "https://placehold.co/100x100/046A62/FFFFFF?text=Harmony";
        if (!imgData) return placeholder;
        let imgString = Array.isArray(imgData) ? imgData[0] : imgData;
        if (imgString.startsWith('http')) return imgString;
        return `https://harmony-api-t9h0.onrender.com${imgString.startsWith('/') ? imgString : '/' + imgString}`;
    };

    const handleOrder = async () => {
        if (!shippingInfo.fullName || !shippingInfo.phone || !shippingInfo.addressDetail) {
            toast.warn("Vui lòng hoàn thiện thông tin giao hàng bắt buộc (*)");
            return;
        }
        setIsOrdering(true);
        try {
            const payload = {
                items: products.map(p => ({
                    productId: p.productId || p._id,
                    quantity: p.quantity,
                    price: Math.round(p.price * (1 - (p.discount || 0) / 100))
                })),
                fullName: shippingInfo.fullName,
                phone: shippingInfo.phone,
                email: shippingInfo.email,
                address: `${shippingInfo.addressDetail}, ${shippingInfo.district}, ${shippingInfo.province}`,
                totalAmount: stats.final,
                paymentMethod: 'COD'
            };
            const res = await axios.post('https://harmony-api-t9h0.onrender.com/api/orders/create', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success("Đặt hàng thành công!");
                localStorage.removeItem('cart');
                setTimeout(() => navigate('/'), 2000); 
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi hệ thống!");
        } finally { setIsOrdering(false); }
    };

    return (
        <div className="hc-wrapper">
            <ToastContainer position="top-center" autoClose={5000} />
            
            <header className="hc-header">
                <div className="hc-container hc-header-inner">
                    <Link to="/" className="hc-brand">
                        {/* Sử dụng biến logoHarmony đã import ở Bước 1 */}
                        <img src={logoHarmony} alt="Logo Harmony" className="hc-logo" />
                        <span className="hc-divider">|</span>
                        <span className="hc-title">THANH TOÁN</span>
                    </Link>
                    <div className="hc-breadcrumb">
                        <Link to="/cart">Giỏ hàng</Link>
                        <span className="hc-arrow">/</span>
                        <span className="hc-active">Thanh toán</span>
                    </div>
                </div>
            </header>

            <main className="hc-container hc-main">
                <div className="hc-left">
                    <div className="hc-card">
                        <h2 className="hc-heading">Thông tin giao hàng</h2>
                        <div className="hc-row">
                            <div className="hc-form-group">
                                <label>Họ và tên *</label>
                                <input type="text" placeholder="Nhập họ tên đầy đủ" value={shippingInfo.fullName} onChange={e => setShippingInfo({...shippingInfo, fullName: e.target.value})} />
                            </div>
                            <div className="hc-form-group">
                                <label>Số điện thoại *</label>
                                <input type="text" placeholder="09xxxxxxxx" value={shippingInfo.phone} onChange={e => setShippingInfo({...shippingInfo, phone: e.target.value})} />
                            </div>
                        </div>
                        <div className="hc-form-group">
                            <label>Địa chỉ Email (Không bắt buộc)</label>
                            <input type="email" placeholder="email@gmail.com" value={shippingInfo.email} onChange={e => setShippingInfo({...shippingInfo, email: e.target.value})} />
                        </div>
                        <div className="hc-row">
                            <div className="hc-form-group">
                                <label>Tỉnh / Thành phố *</label>
                                <input type="text" placeholder="Ví dụ: Hà Nội" value={shippingInfo.province} onChange={e => setShippingInfo({...shippingInfo, province: e.target.value})} />
                            </div>
                            <div className="hc-form-group">
                                <label>Quận / Huyện *</label>
                                <input type="text" placeholder="Ví dụ: Cầu Giấy" value={shippingInfo.district} onChange={e => setShippingInfo({...shippingInfo, district: e.target.value})} />
                            </div>
                        </div>
                        <div className="hc-form-group">
                            <label>Địa chỉ chi tiết (Số nhà, tên đường) *</label>
                            <textarea rows="3" placeholder="Số nhà 69..." value={shippingInfo.addressDetail} onChange={e => setShippingInfo({...shippingInfo, addressDetail: e.target.value})} />
                        </div>
                    </div>

                    <div className="hc-card hc-mt-4">
                        <h2 className="hc-heading">Phương thức thanh toán</h2>
                        <div className="hc-payment-box">
                            <span className="hc-check">✔</span>
                            <div>
                                <strong style={{color: '#008080'}}>Thanh toán khi nhận hàng (COD)</strong>
                                <p style={{margin: '5px 0 0 0', fontSize: '13px', color: '#666'}}>Quý khách sẽ thanh toán bằng tiền mặt khi nhận hàng.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hc-right">
                    <div className="hc-card hc-sticky">
                        <div className="hc-summary-header">
                            <h2>Đơn hàng của bạn ({products.length})</h2>
                            <Link to="/cart">Sửa</Link>
                        </div>
                        <div className="hc-product-list">
                            {products.map(p => (
                                <div className="hc-product-item" key={p.productId || p._id}>
                                    <div className="hc-img-box">
                                        <img src={getImageUrl(p.images || p.image)} alt={p.name} />
                                        <span className="hc-qty">{p.quantity}</span>
                                    </div>
                                    <div className="hc-prod-info">
                                        <p className="hc-prod-name">{p.name}</p>
                                        <p className="hc-prod-price">{(p.price * (1 - (p.discount || 0)/100)).toLocaleString()} Đ</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="hc-bill">
                            <div className="hc-bill-row"><span>Tạm tính</span><span>{stats.sub.toLocaleString()} Đ</span></div>
                            <div className="hc-bill-row" style={{color: '#E74C3C'}}><span>Giảm giá</span><span>-{stats.dis.toLocaleString()} Đ</span></div>
                            <div className="hc-bill-row"><span>Vận chuyển</span><span style={{color: '#27AE60', fontWeight: 'bold'}}>Miễn phí</span></div>
                            <div className="hc-bill-line"></div>
                            <div className="hc-bill-row hc-total"><span>Tổng cộng</span><span>{stats.final.toLocaleString()} Đ</span></div>
                        </div>
                        <button className={`hc-btn-submit ${isOrdering ? 'loading' : ''}`} onClick={handleOrder} disabled={isOrdering}>
                            {isOrdering ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẶT HÀNG"}
                        </button>
                        <div className="hc-trust-badges">
                            <span>Bảo mật 100%</span>
                            <span>Đổi trả 7 ngày</span>
                            <span>Chính hãng</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Checkout;
