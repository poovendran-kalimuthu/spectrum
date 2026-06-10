const fs = require('fs');

// 1. Refactor AdminEventDetail.jsx
let jsxContent = fs.readFileSync('src/components/AdminEventDetail.jsx', 'utf8');

const target1 = `{activeTab === 'dashboard' ? (
            <>
              <button className="btn btn-primary btn-sm" onClick={() => setActiveTab(1)} style={{ background: 'var(--clr-accent)', borderColor: 'var(--clr-accent)' }}>
                <Settings size={14} /> Configure Event
              </button>
              <button className="btn btn-accent btn-sm" onClick={() => navigate(\`/admin/events/\${event?.slug || event?._id || id}/participants\`)}>
                <Users size={14} /> Manage Participants
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => navigate(\`/admin/events/\${event?.slug || event?._id || id}/evaluators\`)} style={{ color: 'var(--clr-text-subtle)', borderColor: 'var(--clr-border)' }}>
                <Award size={14} /> Assign Evaluators
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => navigate(\`/admin/events/\${event?.slug || event?._id || id}/attendance\`)} style={{ color: 'var(--clr-text-subtle)', borderColor: 'var(--clr-border)' }}>
                <CheckCircle2 size={14} /> Attendance Control
              </button>
            </>
          ) : (`;
const replace1 = `{activeTab === 'dashboard' ? null : (`;

jsxContent = jsxContent.replace(target1, replace1);

const target2 = `<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <EventCountdown title={event?.title} date={event?.date} />
          </div>
          <div className="adb-container">`;
const replace2 = `<div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <EventCountdown title={event?.title} date={event?.date} />
          </div>
          <div style={{ maxWidth: '1200px', margin: '0 auto 2rem' }}>
            <div className="adb-modules-grid">
              <div className="adb-module-card" onClick={() => setActiveTab(1)}>
                <div className="adb-module-icon blue-icon"><Settings size={22} /></div>
                <div className="adb-module-text">
                  <h3>Configure Event</h3>
                  <p>Settings, rounds, and criteria</p>
                </div>
              </div>
              <div className="adb-module-card" onClick={() => navigate(\`/admin/events/\${event?.slug || event?._id || id}/participants\`)}>
                <div className="adb-module-icon purple-icon"><Users size={22} /></div>
                <div className="adb-module-text">
                  <h3>Manage Participants</h3>
                  <p>Registrations & shortlisting</p>
                </div>
              </div>
              <div className="adb-module-card" onClick={() => navigate(\`/admin/events/\${event?.slug || event?._id || id}/evaluators\`)}>
                <div className="adb-module-icon yellow-icon"><Award size={22} /></div>
                <div className="adb-module-text">
                  <h3>Assign Evaluators</h3>
                  <p>Manage event judges</p>
                </div>
              </div>
              <div className="adb-module-card" onClick={() => navigate(\`/admin/events/\${event?.slug || event?._id || id}/attendance\`)}>
                <div className="adb-module-icon green-icon"><CheckCircle2 size={22} /></div>
                <div className="adb-module-text">
                  <h3>Attendance Control</h3>
                  <p>Scan & verify participants</p>
                </div>
              </div>
            </div>
          </div>
          <div className="adb-container">`;

jsxContent = jsxContent.replace(target2, replace2);

fs.writeFileSync('src/components/AdminEventDetail.jsx', jsxContent);

// 2. Add CSS to AdminEvents.css
const cssToAdd = `

/* Dashboard Modules Grid */
.adb-modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-top: 1.5rem;
  padding: 0 1.5rem;
}
.adb-module-card {
  background: var(--clr-surface);
  border: 1.5px solid var(--clr-border);
  border-radius: var(--radius-xl);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}
.adb-module-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: #cbd5e1;
}
.dark .adb-module-card:hover {
  border-color: #475569;
}
.adb-module-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.adb-module-icon.blue-icon { background: #eff6ff; color: #3b82f6; }
.adb-module-icon.purple-icon { background: #f3e8ff; color: #a855f7; }
.adb-module-icon.yellow-icon { background: #fefce8; color: #eab308; }
.adb-module-icon.green-icon { background: #f0fdf4; color: #22c55e; }
.dark .adb-module-icon.blue-icon { background: rgba(59, 130, 246, 0.15); }
.dark .adb-module-icon.purple-icon { background: rgba(168, 85, 247, 0.15); }
.dark .adb-module-icon.yellow-icon { background: rgba(234, 179, 8, 0.15); }
.dark .adb-module-icon.green-icon { background: rgba(34, 197, 94, 0.15); }

.adb-module-text {
  display: flex;
  flex-direction: column;
}
.adb-module-text h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--clr-text-heading);
  margin: 0 0 5px 0;
  line-height: 1.2;
}
.adb-module-text p {
  font-size: 0.8125rem;
  color: var(--clr-text-muted);
  margin: 0;
  line-height: 1.4;
}

@media (max-width: 640px) {
  .adb-modules-grid { grid-template-columns: 1fr; padding: 0 1rem; }
}
`;

fs.appendFileSync('src/components/AdminEvents.css', cssToAdd);

console.log("Refactoring complete.");
