const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const cafes = [
  {
    cafeId: 'your_cafe_id',
    qrCode: 'YOUR_UNIQUE_CODE_2024'
  }
];

async function generateQRCodes() {
  const qrDir = path.join(__dirname, '../../qrcodes');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir);
  }

  for (const cafe of cafes) {
    const url = `http://localhost:3000?qr=${encodeURIComponent(cafe.qrCode)}`;
    
    // In production, replace localhost:3000 with your actual domain
    // const url = `https://your-domain.com?qr=${encodeURIComponent(cafe.qrCode)}`;
    
    const filePath = path.join(qrDir, `${cafe.cafeId}.png`);
    
    await QRCode.toFile(filePath, url, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400
    });
    
    console.log(`Generated QR code for ${cafe.cafeId}`);
  }
}

generateQRCodes();