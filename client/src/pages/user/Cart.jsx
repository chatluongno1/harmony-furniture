import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logoHarmony from '../../assets/images/Logo_Hamory.png';
import '../../css/cart.css'; 

const Cart = () => {
    const navigate = useNavigate();
    
    const [cartItems, setCartItems] = useState(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            return [];
        }
    });
    
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    const getImageUrl = (imgData) => {
        const placeholder = "https://placehold.co/100x100/046A62/FFFFFF?text=Harmony";
        if (!imgData) return placeholder;
        let imgString = Array.isArray(imgData) ? imgData[0] : imgData;
        if (!imgString) return placeholder;
        if (imgString.startsWith('http')) return imgString;
        const formattedPath = imgString.startsWith('/') ? imgString : `/${imgString}`;
        return `https://harmony-api-t9h0.onrender.com${formattedPath}`;
    };

    const handleSelect = (productId) => {
        if (selectedItems.includes(productId)) {
            setSelectedItems(selectedItems.filter(id => id !== productId));
        } else {
            setSelectedItems([...selectedItems, productId]);
        }
    };

    const handleSelectAll = () => {
        if (selectedItems.length === cartItems.length && cartItems.length > 0) {
            setSelectedItems([]);
        } else {
            setSelectedItems(cartItems.map(item => item.productId || item._id));
        }
    };

    const updateQuantity = (productId, delta) => {
        setCartItems(cartItems.map(item => {
            if ((item.productId || item._id) === productId) {
                const newQty = item.quantity + delta;
                return { ...item, quantity: newQty > 0 ? newQty : 1 };
            }
            return item;
        }));
    };

    const removeItem = (productId) => {
        if (window.confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?")) {
            setCartItems(cartItems.filter(item => (item.productId || item._id) !== productId));
            setSelectedItems(selectedItems.filter(id => id !== productId));
        }
    };

    const calculateTotal = () => {
        return cartItems
            .filter(item => selectedItems.includes(item.productId || item._id))
            .reduce((total, item) => {
                const price = Math.round(item.price * (1 - (item.discount || 0) / 100));
                return total + (price * item.quantity);
            }, 0);
    };

    const handleCheckout = () => {
        if (selectedItems.length === 0) {
            toast.warn("Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!");
            return;
        }
        const productsToCheckout = cartItems.filter(item => selectedItems.includes(item.productId || item._id));
        navigate('/checkout', { state: { products: productsToCheckout } });
    };

    return (
        <div className="hc-wrapper">
            <ToastContainer position="top-center" autoClose={2000} />

            <header className="hc-header">
                <div className="hc-container hc-header-inner">
                    <Link to="/" className="hc-brand">
                        {/* Sử dụng biến logoHarmony đã import ở Bước 1 */}
                        <img src={logoHarmony} alt="Logo Harmony" className="hc-logo" />
                        <span className="hc-divider">|</span>
                        <span className="hc-title">GIỎ HÀNG</span>
                    </Link>
                    
                    {/* Đã thay thanh tìm kiếm bằng Nút "Tiếp tục mua sắm" hợp lý hơn */}
                    <Link to="/products" className="hc-continue-shopping">
                        &#8592; Tiếp tục mua sắm
                    </Link>
                </div>
            </header>

            <main className="hc-container hc-main">
                <div className="hc-left">
                    <div className="hc-cart-card">
                        {/* TIÊU ĐỀ CÁC CỘT */}
                        <div className="hc-cart-header">
                            <div className="hc-col-product">
                                <input 
                                    type="checkbox" 
                                    checked={cartItems.length > 0 && selectedItems.length === cartItems.length}
                                    onChange={handleSelectAll}
                                />
                                <span>Sản phẩm</span>
                            </div>
                            <span className="hc-col-price">Đơn giá</span>
                            <span className="hc-col-qty">Số lượng</span>
                            <span className="hc-col-total">Số tiền</span>
                            <span className="hc-col-action">Thao tác</span>
                        </div>

                        {/* DANH SÁCH SẢN PHẨM */}
                        <div className="hc-cart-list">
                            {cartItems.length === 0 ? (
                                <div className="hc-empty-cart">Giỏ hàng của bạn đang trống.</div>
                            ) : (
                                cartItems.map(item => {
                                    const id = item.productId || item._id;
                                    const finalPrice = Math.round(item.price * (1 - (item.discount || 0) / 100));
                                    
                                    return (
                                        <div className="hc-cart-item" key={id}>
                                            <div className="hc-col-product">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedItems.includes(id)}
                                                    onChange={() => handleSelect(id)}
                                                />
                                                <img 
                                                    src={getImageUrl(item.image)} 
                                                    alt={item.name} 
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://placehold.co/100x100/046A62/FFFFFF?text=Error";
                                                    }}
                                                />
                                                <div className="hc-item-info">
                                                    <Link to={`/product/${id}`} className="hc-item-name">{item.name}</Link>
                                                </div>
                                            </div>
                                            
                                            <div className="hc-col-price">
                                                <div className="hc-price-current">{finalPrice.toLocaleString()} Đ</div>
                                            </div>
                                            
                                            <div className="hc-col-qty">
                                                <div className="hc-qty-control">
                                                    <button onClick={() => updateQuantity(id, -1)}>-</button>
                                                    <input type="text" value={item.quantity} readOnly />
                                                    <button onClick={() => updateQuantity(id, 1)}>+</button>
                                                </div>
                                            </div>
                                            
                                            <div className="hc-col-total hc-text-gold">
                                                {(finalPrice * item.quantity).toLocaleString()} Đ
                                            </div>
                                            
                                            <div className="hc-col-action">
                                                <button className="hc-btn-delete" onClick={() => removeItem(id)}>
                                                    Xóa
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                <div className="hc-right">
                    <div className="hc-card hc-sticky">
                        <h2 className="hc-summary-title">Tóm tắt đơn hàng</h2>
                        <div className="hc-bill">
                            <div className="hc-bill-row">
                                <span>Sản phẩm đã chọn:</span>
                                <span>{selectedItems.length}</span>
                            </div>
                            <div className="hc-bill-line"></div>
                            <div className="hc-bill-row hc-total">
                                <span>Tổng thanh toán:</span>
                                <span>{calculateTotal().toLocaleString()} Đ</span>
                            </div>
                        </div>

                        <button 
                            className="hc-btn-submit" 
                            onClick={handleCheckout}
                            disabled={selectedItems.length === 0}
                            style={{ opacity: selectedItems.length === 0 ? 0.6 : 1 }}
                        >
                            TIẾN HÀNH THANH TOÁN
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Cart;
