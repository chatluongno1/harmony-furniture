import Order from '../models/Order.js';

// =======================================================================
// THUẬT TOÁN TẠO MÃ ĐƠN HÀNG (HD + YYMM + STT) - Reset mỗi tháng
// =======================================================================
const generateOrderNo = async () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // ĐÃ ĐỔI: Tiền tố từ MD thành HD
    const prefix = `HD${year}${month}-`; // VD: HD2604-

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const lastOrder = await Order.findOne({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        orderNo: { $regex: `^${prefix}` } 
    }).sort({ createdAt: -1 });

    let sequence = 1;
    if (lastOrder && lastOrder.orderNo) {
        const lastSequence = parseInt(lastOrder.orderNo.split('-')[1], 10);
        if (!isNaN(lastSequence)) {
            sequence = lastSequence + 1;
        }
    }

    let orderNo = `${prefix}${sequence.toString().padStart(4, '0')}`;

    let exists = await Order.findOne({ orderNo });
    while (exists) {
        sequence++;
        orderNo = `${prefix}${sequence.toString().padStart(4, '0')}`;
        exists = await Order.findOne({ orderNo });
    }

    return orderNo;
};

// =======================================================================
// CONTROLLER CHÍNH
// =======================================================================
class OrderController {
    // 1. Tạo đơn hàng (Checkout)
    createOrder = async (req, res) => {
        try {
            const orderData = req.body;
            if (req.user) orderData.userId = req.user.id;

            // GỌI THUẬT TOÁN TẠO MÃ ĐƠN HÀNG VÀ GÁN VÀO DỮ LIỆU
            orderData.orderNo = await generateOrderNo(); 

            const newOrder = new Order(orderData);
            await newOrder.save();

            // Không gửi email xác nhận
            res.status(201).json({ success: true, order: newOrder });
        } catch (error) {
            res.status(500).json({ message: "Lỗi tạo đơn hàng", error: error.message });
        }
    };

    // 2. Lấy đơn hàng của tôi (User)
    getUserOrders = async (req, res) => {
        try {
            const orders = await Order.find({ userId: req.user.id })
                .populate('userId', 'fullName email username phoneNumber')
                .populate({
                    path: 'items.productId',
                    select: 'name images image category price' 
                })
                .sort({ createdAt: -1 });
            res.json(orders);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // 3. Admin: Lấy tất cả đơn hàng
    getAllOrders = async (req, res) => {
        try {
            const orders = await Order.find()
                .populate('userId', 'fullName email username phoneNumber')
                .populate({
                    path: 'items.productId',
                    select: 'name images image category price'
                })
                .sort({ createdAt: -1 });
            res.json(orders);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // 4. Admin: Cập nhật trạng thái đơn (Duyệt/Hủy)
    updateStatus = async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            // Cập nhật Database và lấy thông tin đơn hàng mới nhất
            const updatedOrder = await Order.findByIdAndUpdate(
                id, 
                { status }, 
                { returnDocument: 'after' } 
            ).populate('userId', 'email fullName');

            // Không gửi email cập nhật trạng thái
            res.json({ success: true, order: updatedOrder });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    // 5. Admin: Thống kê doanh thu (Cho Dashboard & RevenueTab)
    getRevenueStats = async (req, res) => {
        try {
            const { year, monthA, monthB } = req.query;
            const targetYear = parseInt(year) || new Date().getFullYear();
            const m1 = parseInt(monthA) || 1;
            const m2 = parseInt(monthB) || 2;

            const validStatuses = ['completed', 'approved'];

            // Top 10 Sản phẩm bán chạy nhất trong năm
            const topProducts = await Order.aggregate([
                { $match: {
                    status: { $in: validStatuses },
                    createdAt: {
                        $gte: new Date(`${targetYear}-01-01`),
                        $lte: new Date(`${targetYear}-12-31T23:59:59.999Z`)
                    }
                }},
                { $unwind: "$items" },
                { $group: {
                    _id: "$items.name",
                    totalQty: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }},
                { $sort: { totalQty: -1 } },
                { $limit: 10 },
                { $project: { name: "$_id", totalQty: 1, totalRevenue: 1, _id: 0 } }
            ]);

            // Top 10 Khách hàng mua nhiều nhất trong năm
            const topCustomers = await Order.aggregate([
                { $match: {
                    status: { $in: validStatuses },
                    createdAt: {
                        $gte: new Date(`${targetYear}-01-01`),
                        $lte: new Date(`${targetYear}-12-31T23:59:59.999Z`)
                    }
                }},
                { $unwind: "$items" },
                { $group: {
                    _id: "$fullName",
                    totalItems: { $sum: "$items.quantity" }
                }},
                { $sort: { totalItems: -1 } },
                { $limit: 10 },
                { $project: { fullName: "$_id", totalItems: 1, _id: 0 } }
            ]);

            // Lấy dữ liệu biểu đồ cho Top 4 sản phẩm
            const top4Names = topProducts.slice(0, 4).map(p => p.name);

            const getMonthRevenueForTop4 = async (month) => {
                if (top4Names.length === 0) return [];
                const startDate = new Date(targetYear, month - 1, 1);
                const endDate = new Date(targetYear, month, 0, 23, 59, 59, 999);

                const monthAgg = await Order.aggregate([
                    { $match: {
                        status: { $in: validStatuses },
                        createdAt: { $gte: startDate, $lte: endDate }
                    }},
                    { $unwind: "$items" },
                    { $match: { "items.name": { $in: top4Names } } },
                    { $group: {
                        _id: "$items.name",
                        revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                    }}
                ]);

                return top4Names.map(name => {
                    const found = monthAgg.find(m => m._id === name);
                    return found ? found.revenue : 0;
                });
            };

            const dataA = await getMonthRevenueForTop4(m1);
            const dataB = await getMonthRevenueForTop4(m2);

            res.status(200).json({
                topProducts,
                topCustomers,
                dataA,
                dataB
            });

        } catch (error) {
            console.error("Lỗi getRevenueStats:", error);
            res.status(500).json({ error: error.message });
        }
    };

    // 6. Admin: Xóa đơn hàng
    deleteOrder = async (req, res) => {
        try {
            await Order.findByIdAndDelete(req.params.id);
            res.json({ success: true, message: "Đã xóa đơn hàng" });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    };

    // 7. Xác nhận đã nhận hàng (User)
    markAsReceived = async (req, res) => {
        try {
            const order = await Order.findOneAndUpdate(
                { _id: req.params.orderId, userId: req.user.id },
                { status: 'completed' }, 
                { returnDocument: 'after' } 
            );
            res.json(order);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };
}

export default new OrderController();