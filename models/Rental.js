const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  numberOfPlates: { type: Number, required: true },
  ratePerPlate: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  durationDays: { type: Number, required: true },
  totalRent: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['active','pending','completed'], default: 'active' },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Rental', rentalSchema);
