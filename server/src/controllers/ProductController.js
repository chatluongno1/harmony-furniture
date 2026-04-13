import Product from '../models/Product.js';
import Category from '../models/Category.js'; 
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ProductController {
    // 1. Lấy tất cả sản phẩm
    async getAll(req, res) {
        try {
            const { category, priceRange, sort, page = 1, limit = 12 } = req.query;
            let query = { isHidden: { $ne: true } };

            if (category) query.category = category;

            if (priceRange) {
                let priceQuery = {};
                if (priceRange === '1-5') priceQuery = { $gte: 1000000, $lte: 5000000 };
                else if (priceRange === '5-10') priceQuery = { $gte: 5000000, $lte: 10000000 };
                else if (priceRange === '10-15') priceQuery = { $gte: 10000000, $lte: 15000000 };
                else if (priceRange === '15-20') priceQuery = { $gte: 15000000, $lte: 20000000 };
                else if (priceRange === '20-up') priceQuery = { $gt: 20000000 };
                
                if (Object.keys(priceQuery).length) query.price = priceQuery;
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            let productQuery = Product.find(query)
                .populate('category', 'name')
                .select('-descriptions')  // Exclude descriptions để giảm dung lượng
                .skip(skip)
                .limit(parseInt(limit))
                .lean();  // Return plain JS objects thay vì Mongoose documents

            if (sort === 'price-asc') productQuery = productQuery.sort({ price: 1 });
            else if (sort === 'price-desc') productQuery = productQuery.sort({ price: -1 });
            else productQuery = productQuery.sort({ createdAt: -1 });

            const [products, totalProducts] = await Promise.all([
                productQuery.exec(),
                Product.countDocuments(query)
            ]);

            const totalPages = Math.ceil(totalProducts / limit);

            res.status(200).json({ products, totalPages, currentPage: parseInt(page), totalProducts });
        } catch (error) {
            res.status(500).json({ message: "Lỗi server", error: error.message });
        }
    }

    // 2. Thêm sản phẩm
    async add(req, res) {
        try {
            const { name, price, category, stock, discount, status } = req.body;
            let descriptionsData = [];
            
            if (req.body.descriptions) {
                try {
                    descriptionsData = JSON.parse(req.body.descriptions);
                } catch (e) {
                    return res.status(400).json({ message: 'Dữ liệu mô tả không hợp lệ' });
                }
            }

            const mainImages = req.files && req.files['images'] 
                ? req.files['images'].map(file => `/uploads/${file.filename}`)
                : [];

            if(req.files) {
                descriptionsData.forEach((desc, index) => {
                    const field = `descImages[${index}]`;
                    const descFiles = req.files[field] || [];
                    desc.images = desc.existingImages || []; 
                    desc.images.push(...descFiles.map(file => `/uploads/${file.filename}`));
                });
            }

            const newProduct = new Product({
                name,
                price: Number(price),
                category,
                stock: Number(stock),
                discount: Number(discount),
                isHidden: status === 'false' || status === false, 
                images: mainImages,
                descriptions: descriptionsData,
            });

            await newProduct.save();
            res.status(201).json({ message: 'Thêm sản phẩm thành công!' });
        } catch (error) {
            console.error('Lỗi add:', error);
            res.status(500).json({ message: error.message });
        }
    }

    // 3. Cập nhật sản phẩm (Đã khắc phục lỗi sập Server)
    async update(req, res) {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

            const { name, price, category, stock, discount, status } = req.body;

            // Cập nhật thông tin cơ bản
            if (name) product.name = name;
            if (price !== undefined) product.price = Number(price);
            if (category) product.category = category;
            if (stock !== undefined) product.stock = Number(stock);
            if (discount !== undefined) product.discount = Number(discount);
            if (status !== undefined) product.isHidden = (status === 'false' || status === false);

            // Xử lý giữ lại ảnh chính cũ
            if (req.body.existingMainImages) {
                try {
                    const kept = JSON.parse(req.body.existingMainImages);
                    product.images = kept;
                } catch (e) { console.error('Lỗi parse ảnh cũ:', e); }
            } else {
                product.images = []; // Nếu không có ảnh cũ nào được giữ lại
            }
            
            // Xử lý thêm ảnh chính mới
            if (req.files && req.files['images']) {
                const newMain = req.files['images'].map(file => `/uploads/${file.filename}`);
                product.images.push(...newMain);
            }

            // Xử lý cập nhật mô tả chi tiết
            if (req.body.descriptions) {
                try {
                    const descriptionsData = JSON.parse(req.body.descriptions);
                    if (req.files) {
                        descriptionsData.forEach((desc, index) => {
                            const field = `descImages[${index}]`;
                            const newFiles = req.files[field] ? req.files[field].map(file => `/uploads/${file.filename}`) : [];
                            desc.images = desc.existingImages || [];
                            desc.images.push(...newFiles);
                        });
                    }
                    product.descriptions = descriptionsData;
                } catch (e) { console.error('Lỗi parse descriptions:', e); }
            }

            await product.save();
            res.status(200).json({ message: 'Cập nhật thành công!', product });
        } catch (error) {
            console.error("Lỗi Update Product:", error);
            // Trả thẳng lỗi về, không được dùng next(error)
            res.status(500).json({ message: "Lỗi máy chủ khi cập nhật", error: error.message });
        }
    }

    // 4. Xóa sản phẩm
    async delete(req, res) {
        try {
            const product = await Product.findByIdAndDelete(req.params.id);
            if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
            res.status(200).json({ message: 'Xóa sản phẩm thành công' });
        } catch (error) {
            console.error("Lỗi xóa sản phẩm:", error);
            res.status(500).json({ message: error.message });
        }
    }

    // 5. Lấy chi tiết 1 sản phẩm
    async getById(req, res) {
        try {
            const product = await Product.findById(req.params.id).populate('category');
            if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
            res.status(200).json(product);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // 6. Ẩn/Hiện sản phẩm nhanh
    async toggleHide(req, res) {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
            
            product.isHidden = !product.isHidden;
            await product.save();
            res.status(200).json({ message: "Cập nhật trạng thái hiển thị thành công" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new ProductController();