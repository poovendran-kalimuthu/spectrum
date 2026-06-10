const fs = require('fs');
const path = require('path');
const os = require('os');

const downloadsDir = path.join(os.homedir(), 'Downloads');
const destDir = path.join(__dirname, 'frontend', 'src', 'assets', 'illustrations');

const files = fs.readdirSync(downloadsDir)
  .filter(file => file.endsWith('.svg'))
  .map(file => ({
    name: file,
    time: fs.statSync(path.join(downloadsDir, file)).mtime.getTime()
  }))
  .sort((a, b) => b.time - a.time)
  .slice(0, 5);

// Let's rename them appropriately
const names = ['security_pana.svg', 'report_pana.svg', 'email_pana.svg', 'writing_pana.svg', 'team_pana.svg'];

files.forEach((file, index) => {
  const src = path.join(downloadsDir, file.name);
  const dest = path.join(destDir, names[index]);
  fs.copyFileSync(src, dest);
  console.log(`Copied ${file.name} to ${names[index]}`);
});
