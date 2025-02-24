const mongoose = require('mongoose');
const Cafe = require('../models/cafe');
require('dotenv').config();

const cafes = [
  {
    cafeId: 'cafe1',
    name: 'Coffee House Downtown',
    location: '123 Main Street',
    qrCode: 'CAFE1_QR_2024' // This will be encoded in the QR
  },
  {
    cafeId: 'cafe2',
    name: 'Brew & Bean',
    location: '456 Park Avenue',
    qrCode: 'CAFE2_QR_2024'
  },
  {
    cafeId: 'your_cafe_id',  // e.g., 'starbucks_bandra'
    name: 'Your Cafe Name',   // e.g., 'Starbucks Bandra'
    location: 'Your Location', // e.g., 'Bandra West, Mumbai'
    qrCode: 'YOUR_UNIQUE_CODE_2024' // This is what you'll encode in QR
  }
  // Add more cafes as needed
];

async function addCafes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const cafe of cafes) {
      await Cafe.create(cafe);
      console.log(`Added cafe: ${cafe.name}`);
    }

    console.log('All cafes added successfully');
  } catch (error) {
    console.error('Error adding cafes:', error);
  } finally {
    await mongoose.disconnect();
  }
}

addCafes();