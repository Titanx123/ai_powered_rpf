const mongoose = require('mongoose');


const itemSchema = new mongoose.Schema({
    category: String,
    description: String,
    quantity: Number,
    specs: mongoose.Schema.Types.Mixed
  });


  const RFPSchema = new mongoose.Schema({
    title: String,
    description: String,
    budget: Number,
    currency: String,
    deliveryDays: Number,
    paymentTerms: String,
    warrantyMonths: Number,
    items: [itemSchema],
    createdAt: { type: Date, default: Date.now }
  });


  module.exports = mongoose.model('RFP', RFPSchema);
