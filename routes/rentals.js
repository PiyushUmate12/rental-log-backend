const express = require('express');
const router = express.Router();
const controller = require('../controllers/rentalController');

router.post('/', controller.createRental);
router.get('/', controller.getRentals);
router.get('/export/pdf', controller.exportPDF);
router.put('/:id', controller.updateRental);
router.delete('/:id', controller.deleteRental);

module.exports = router;
