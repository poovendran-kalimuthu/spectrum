const fs = require('fs');
let c = fs.readFileSync('src/components/AdminEventDetail.jsx', 'utf8').split(/\r?\n/);
const idx = c.findIndex(l => l.includes('// Round Builder Handlers'));
if (idx !== -1) {
  c.splice(idx, 0, `  const handleRoundsNumberChange = (e) => {
    let val = parseInt(e.target.value) || 1;
    if (val < 1) val = 1;
    if (val > 10) val = 10;
    
    setFormData(prev => {
      let newConfig = [...(prev.roundConfig || [])];
      if (val > newConfig.length) {
        while (newConfig.length < val) {
          const newRoundNumber = newConfig.length + 1;
          newConfig.push({
            roundNumber: newRoundNumber,
            name: \`Round \${newRoundNumber}\`,
            evaluationType: 'admin',
            criteria: [{ name: 'Overall', maxScore: 10 }],
            maxAdvance: 0
          });
        }
      } else if (val < newConfig.length) {
        newConfig = newConfig.slice(0, val);
      }
      return { ...prev, rounds: val, roundConfig: newConfig };
    });
  };
`);
  fs.writeFileSync('src/components/AdminEventDetail.jsx', c.join('\n'));
  console.log('Added handleRoundsNumberChange');
} else {
  console.log('Not found!');
}
