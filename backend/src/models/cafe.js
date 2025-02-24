const mongoose = require('mongoose');

const cafeSchema = new mongoose.Schema({
  cafeId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  qrCode: {
    type: String,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('Cafe', cafeSchema); 