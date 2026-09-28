import Tesseract from 'tesseract.js';
import * as path from 'path';
import { Jimp } from 'jimp';

async function testOCR() {
  const file = path.join(process.cwd(), 'uploads', 'files-1790597014732-187709384.png');
  
  const image = await Jimp.read(file);
  
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
    const red   = this.bitmap.data[idx + 0];
    const green = this.bitmap.data[idx + 1];
    const blue  = this.bitmap.data[idx + 2];
    
    // A pixel is red if red is significantly higher than green and blue
    if (red > 150 && green < 150 && blue < 150) {
       // Red pixel -> make it black
       this.bitmap.data[idx + 0] = 0;
       this.bitmap.data[idx + 1] = 0;
       this.bitmap.data[idx + 2] = 0;
    } else {
       // Not a red pixel -> make it white
       this.bitmap.data[idx + 0] = 255;
       this.bitmap.data[idx + 1] = 255;
       this.bitmap.data[idx + 2] = 255;
    }
  });

  await image.write('test.png');

  console.log('Running OCR on Red-Isolated Image...');
  const { data: d1 } = await Tesseract.recognize('test.png', 'eng', { tessedit_pageseg_mode: '11', tessedit_char_whitelist: '0123456789' });
  console.log('--- OCR OUTPUT ---');
  console.log(d1.text);
  console.log('------------------');

}

testOCR().catch(console.error);
