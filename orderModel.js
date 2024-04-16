const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  items: [{ 
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
