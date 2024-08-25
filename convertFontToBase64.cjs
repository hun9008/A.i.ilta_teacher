const fs = require('fs');
const path = require('path');

// TTF 파일 경로 설정 (절대 경로 사용)
const filePath = path.resolve(__dirname, './NotoSansKR-Regular.ttf');

fs.readFile(filePath, (err, data) => {
  if (err) {
    console.error('Error reading the TTF file:', err);
    return;
  }

  const base64 = data.toString('base64');
  const outputFilePath = path.resolve(__dirname, './NotoSansKR-Regular.base64.txt');

  fs.writeFile(outputFilePath, base64, (err) => {
    if (err) {
      console.error('Error writing the Base64 file:', err);
      return;
    }

    console.log('Base64 encoding completed successfully and saved to', outputFilePath);
  });
});
