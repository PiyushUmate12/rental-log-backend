const Customer = require('../models/Customer');
const Rental = require('../models/Rental');
const PDFDocument = require('pdfkit');

function daysBetween(start, end) {
  const msPerDay = 24*60*60*1000;
  const s = new Date(start).setHours(0,0,0,0);
  const e = new Date(end).setHours(0,0,0,0);
  return Math.round((e - s) / msPerDay) + 1;
}

exports.createRental = async (req, res) => {
  try {
    const { name, address, phone, numberOfPlates, ratePerPlate, startDate, endDate, notes } = req.body;
    let customer = await Customer.findOne({ name, phone });
    if (!customer) {
      customer = await Customer.create({ name, address, phone });
    } else {
      customer.address = address || customer.address;
      await customer.save();
    }
    const durationDays = daysBetween(startDate, endDate);
    const totalRent = Number((ratePerPlate * numberOfPlates * (durationDays / 30)).toFixed(2));
    const rental = await Rental.create({
      customer: customer._id,
      numberOfPlates,
      ratePerPlate,
      startDate,
      endDate,
      durationDays,
      totalRent,
      notes
    });
    const populated = await rental.populate('customer');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRentals = async (req, res) => {
  try {
    const rentals = await Rental.find().populate('customer').sort({ createdAt: -1 });
    res.json(rentals);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateRental = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.startDate || updates.endDate || updates.numberOfPlates || updates.ratePerPlate) {
      const rental = await Rental.findById(id);
      const start = updates.startDate || rental.startDate;
      const end = updates.endDate || rental.endDate;
      const numberOfPlates = updates.numberOfPlates || rental.numberOfPlates;
      const ratePerPlate = updates.ratePerPlate || rental.ratePerPlate;
      const durationDays = daysBetween(start, end);
      updates.durationDays = durationDays;
      updates.totalRent = Number((ratePerPlate * numberOfPlates * (durationDays/30)).toFixed(2));
    }
    if (updates.name || updates.phone || updates.address) {
      const rental = await Rental.findById(id);
      const cust = await Customer.findById(rental.customer);
      if (updates.name) cust.name = updates.name;
      if (updates.phone) cust.phone = updates.phone;
      if (updates.address) cust.address = updates.address;
      await cust.save();
    }
    const updated = await Rental.findByIdAndUpdate(id, updates, { new: true }).populate('customer');
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteRental = async (req, res) => {
  try {
    const { id } = req.params;
    await Rental.findByIdAndDelete(id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.exportPDF = async (req, res) => {
  try {
    const rentals = await Rental.find().populate('customer').sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="rentals.pdf"',
        'Content-Length': pdfData.length
      });
      res.send(pdfData);
    });

    doc.fontSize(18).text('Rental Log — Construction Plates', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10);
    rentals.forEach((r, idx) => {
      doc.fontSize(12).text(`${idx+1}. ${r.customer.name} (${r.customer.phone || ''}) - ${r.status}`, { continued: false });
      doc.fontSize(10).list([
        `Address: ${r.customer.address || '-'}`,
        `Plates: ${r.numberOfPlates} × ₹${r.ratePerPlate} | Days: ${r.durationDays} | Total: ₹${r.totalRent}`,
        `Paid: ₹${r.paidAmount || 0} | Notes: ${r.notes || '-'}`,
        `Period: ${r.startDate.toISOString().slice(0,10)} to ${r.endDate.toISOString().slice(0,10)}`
      ]);
      doc.moveDown(0.3);
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
