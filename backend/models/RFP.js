const mongoose = require('mongoose');


const itemSchema = new mongoose.Schema({
    category: String,
    description: String,
    quantity: Number,
    specs: mongoose.Schema.Types.Mixed
  });

 const responseSchema = new mongoose.Schema({
  receivedAt: { type: Date, default: Date.now },
  subject: String,
  body: String,
  parsed: mongoose.Schema.Types.Mixed
});

const vendorRefSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
  email: String,
  name: String,
  sentAt: Date,
  responses: [responseSchema]   // ← add this
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
    vendors: [vendorRefSchema],      // <- IMPORTANT: attach vendors here
    createdAt: { type: Date, default: Date.now }
  });

 



  module.exports = mongoose.model('RFP', RFPSchema);
