const fs = require('fs');
const path = require('path');

// Remove .next directory if it exists
const nextDir = path.join(__dirname, '..', '.next');
if (fs.existsSync(nextDir)) {
  console.log('Removing .next directory...');
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('.next directory removed');
} else {
  console.log('.next directory does not exist');
}
