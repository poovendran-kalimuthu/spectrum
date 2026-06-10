const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

const filesToUpdate = [
  'Feedback.jsx',
  'EditProfile.jsx',
  'CompleteProfile.jsx',
  'AdminUsers.jsx',
  'AdminFeedback.jsx',
  'AdminParticipantManagement.jsx',
  'AdminEvents.jsx',
  'AdminEventDetail.jsx',
  'AdminAuditLogs.jsx'
];

for (const fileName of filesToUpdate) {
  const filePath = path.join(componentsDir, fileName);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if it already imports Select
  if (!content.includes('import Select from')) {
    // Add import statement after the last import
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf('\n', lastImportIndex);
    
    content = content.slice(0, endOfLastImport) + "\nimport Select from './ui/Select';" + content.slice(endOfLastImport);
  }

  // Replace <select ...> with <Select ...>
  // Note: we want to match <select, <select> and </select>
  content = content.replace(/<select\b/g, '<Select');
  content = content.replace(/<\/select>/g, '</Select>');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${fileName}`);
}
