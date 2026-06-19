const fs = require('fs');
const path = require('path');

const srcBaseDir = path.join(__dirname, 'Sales Bills');
const destDir = path.join(__dirname, 'public', 'audit_images');

// Ensure target directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const folders = ['5th June', '6th June', '7th June', '8th June'];
const manifest = [];

folders.forEach(folder => {
  const folderPath = path.join(srcBaseDir, folder);
  if (!fs.existsSync(folderPath)) {
    console.log(`Directory not found: ${folderPath}`);
    return;
  }

  const files = fs.readdirSync(folderPath);
  files.forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.jpeg' || ext === '.jpg' || ext === '.png') {
      const srcFile = path.join(folderPath, file);
      // Create a collision-safe destination filename
      const safeDestName = `${folder.replace(/\s+/g, '_')}_${file}`;
      const destFile = path.join(destDir, safeDestName);
      
      fs.copyFileSync(srcFile, destFile);
      
      manifest.push({
        id: safeDestName,
        folder,
        originalName: file,
        path: `/audit_images/${safeDestName}`
      });
    }
  });
});

const manifestPath = path.join(__dirname, 'public', 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

console.log(`Copied ${manifest.length} images to ${destDir} and wrote manifest.json`);
