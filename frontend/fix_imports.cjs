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

  // Fix the bad placement
  if (content.includes('import {\nimport Select from \'./ui/Select\';')) {
    content = content.replace('import {\nimport Select from \'./ui/Select\';', "import Select from './ui/Select';\nimport {");
  }
  if (content.includes('import { \nimport Select from \'./ui/Select\';')) {
    content = content.replace('import { \nimport Select from \'./ui/Select\';', "import Select from './ui/Select';\nimport { ");
  }

  // Double check if Select was successfully imported anywhere
  if (!content.includes('import Select from')) {
    content = "import Select from './ui/Select';\n" + content;
  }

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Fixed imports');
