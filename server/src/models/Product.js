import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Tên sản phẩm không được để trống'],
        trim: true 
    },
    description: { type: String }, 
    descriptions: [
        {
            title: String,
            content: String,
            images: [String]
        }
    ],
    price: { 
        type: Number, 
        required: [true, 'Giá sản phẩm là bắt buộc'],
        min: [0, 'Giá không được nhỏ hơn 0'] 
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, 'Giảm giá tối thiểu là 0%'],
        max: [100, 'Giảm giá tối đa là 100%']
    }, 
    category: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Category', 
        required: [true, 'Sản phẩm phải thuộc một danh mục'] 
    },
    images: [{ type: String }],
    video: { type: String },
    colors: [{ 
        type: String, 
        default: ['#F5F5DC', '#FFFFF0', '#556B2F', '#FFD700'] 
    }],
    stock: { 
        type: Number, 
        required: true,
        default: 0,
        min: [0, 'Số lượng tồn kho không được âm']
    },
    isAvailable: { 
        type: Boolean, 
        default: true 
    },
    isHidden: { 
        type: Boolean,
        default: false
    },
    ratings: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
});

// Trường ảo tính giá sau khi giảm
productSchema.virtual('salePrice').get(function() {
    return Math.round(this.price * (1 - (this.discount / 100)));
});

// Middleware: Tự động kiểm tra tồn kho (Đã xóa tham số next)
productSchema.pre('save', function() {
    if (this.stock <= 0) {
        this.isAvailable = false;
    } else {
        this.isAvailable = true;
    }
});

const Product = mongoose.model('Product', productSchema);
export default Product;