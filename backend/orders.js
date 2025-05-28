const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  medicineName: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true }
});

const shippingAddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true }
});

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'],
    default: 'placed'
  },
  paymentMethod: { type: String, required: true },
  shippingAddress: shippingAddressSchema,
  trackingId: { type: String },
  estimatedDelivery: { type: Date },  createdAt: { 
    type: Date, 
    default: Date.now
  },
  updatedAt: { type: Date, default: Date.now }
});

// Create TTL index for automatic deletion after 7 days
orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

// Update the updatedAt field before saving
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Order", orderSchema);