const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  company: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vendor', VendorSchema);
