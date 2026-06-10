const fs = require('fs');

let jsxContent = fs.readFileSync('src/components/AdminEventDetail.jsx', 'utf8');

const targetJSX = `<div style={{ maxWidth: '1200px', margin: '0 auto 2rem' }}>
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
          </div>`;

const replaceJSX = `<div style={{ maxWidth: '1200px', margin: '0 auto 2rem' }}>
            <div className="adb-modules-grid">
              <div className="adb-module-card-v2" onClick={() => setActiveTab(1)}>
                <div className="adb-module-icon-wrapper" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
                  <Settings size={22} strokeWidth={1.5} />
                </div>
                <h3>Configure Event</h3>
                <p>Define rules, rounds, scoring criteria, and venue details.</p>
                <div className="adb-module-bottom">
                  <div className="adb-fake-slider"><div className="adb-fake-thumb"></div></div>
                  <div className="adb-fake-slider short"><div className="adb-fake-thumb"></div></div>
                </div>
              </div>
              <div className="adb-module-card-v2" onClick={() => navigate(\`/admin/events/\${event?.slug || event?._id || id}/participants\`)}>
                <div className="adb-module-icon-wrapper" style={{ borderColor: '#a855f7', color: '#a855f7' }}>
                  <Users size={22} strokeWidth={1.5} />
                </div>
                <h3>Manage Participants</h3>
                <p>Review registrations, handle teams, and manage shortlists.</p>
                <div className="adb-module-bottom">
                  <div className="adb-fake-avatars">
                    <div className="adb-fake-avatar bg-1"></div>
                    <div className="adb-fake-avatar bg-2"></div>
                    <div className="adb-fake-avatar bg-3"></div>
                    <div className="adb-fake-avatar count">+12</div>
                  </div>
                </div>
              </div>
              <div className="adb-module-card-v2" onClick={() => navigate(\`/admin/events/\${event?.slug || event?._id || id}/evaluators\`)}>
                <div className="adb-module-icon-wrapper" style={{ borderColor: '#eab308', color: '#eab308' }}>
                  <Award size={22} strokeWidth={1.5} />
                </div>
                <h3>Assign Evaluators</h3>
                <p>Allocate judges to specific rounds and track score submissions.</p>
                <div className="adb-module-bottom">
                  <div className="adb-fake-list-item">
                    <div className="adb-fake-list-icon">T</div>
                    <div className="adb-fake-list-text">Technical Round</div>
                    <div className="adb-fake-list-arrow">&gt;</div>
                  </div>
                </div>
              </div>
              <div className="adb-module-card-v2" onClick={() => navigate(\`/admin/events/\${event?.slug || event?._id || id}/attendance\`)}>
                <div className="adb-module-icon-wrapper" style={{ borderColor: '#22c55e', color: '#22c55e' }}>
                  <CheckCircle2 size={22} strokeWidth={1.5} />
                </div>
                <h3>Attendance Control</h3>
                <p>Scan participant QR codes or manually verify presence.</p>
                <div className="adb-module-bottom">
                   <div className="adb-fake-pills">
                     <div className="adb-fake-pill green">Present</div>
                     <div className="adb-fake-pill gray">Pending</div>
                   </div>
                </div>
              </div>
            </div>
          </div>`;

if(jsxContent.includes(targetJSX)) {
  jsxContent = jsxContent.replace(targetJSX, replaceJSX);
  fs.writeFileSync('src/components/AdminEventDetail.jsx', jsxContent);
  console.log("Successfully updated AdminEventDetail.jsx");
} else {
  console.log("Could not find exact JSX target in AdminEventDetail.jsx");
}

let cssContent = fs.readFileSync('src/components/AdminEvents.css', 'utf8');

const targetCSSStart = '/* Dashboard Modules Grid */';
// we will replace from targetCSSStart to the end of the file.
const index = cssContent.indexOf(targetCSSStart);

if (index !== -1) {
  cssContent = cssContent.substring(0, index);
  const newCSS = `/* SaaS Style Module Cards Grid */
.adb-modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  padding: 0 1.5rem;
  margin-top: 1.5rem;
}

.adb-module-card-v2 {
  background: var(--clr-surface);
  border: 1px solid var(--clr-border);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  min-height: 220px;
}
.adb-module-card-v2:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
  border-color: #cbd5e1;
}
.dark .adb-module-card-v2:hover {
  border-color: #475569;
}

.adb-module-icon-wrapper {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1.5px solid var(--clr-accent);
  color: var(--clr-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.adb-module-card-v2 h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--clr-text-heading);
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.adb-module-card-v2 p {
  font-size: 0.8125rem;
  color: var(--clr-text-muted);
  line-height: 1.5;
  margin: 0;
  flex: 1;
}

/* Bottom Decorative Elements */
.adb-module-bottom {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/* Manage Participants Avatars */
.adb-fake-avatars {
  display: flex;
  align-items: center;
}
.adb-fake-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--clr-surface);
  margin-left: -8px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
.adb-fake-avatars .adb-fake-avatar:first-child { margin-left: 0; }
.bg-1 { background-color: #fca5a5; }
.bg-2 { background-color: #93c5fd; }
.bg-3 { background-color: #fcd34d; }
.adb-fake-avatar.count {
  background-color: var(--clr-surface-2);
  color: var(--clr-text-heading);
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Settings Sliders */
.adb-fake-slider {
  height: 6px;
  background: var(--clr-surface-3);
  border-radius: 4px;
  width: 60px;
  position: relative;
  margin-bottom: 12px;
}
.adb-fake-slider.short { width: 40px; margin-bottom: 0; }
.adb-fake-thumb {
  position: absolute;
  top: 50%;
  left: 60%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  background: #3b82f6;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
.adb-fake-slider.short .adb-fake-thumb { left: 30%; background: #94a3b8; }

/* Evaluator List Item */
.adb-fake-list-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--clr-border);
  border-radius: 8px;
  width: 100%;
}
.adb-fake-list-icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: #fefce8;
  color: #eab308;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
}
.adb-fake-list-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--clr-text-heading);
  flex: 1;
}
.adb-fake-list-arrow {
  font-size: 0.75rem;
  color: var(--clr-text-muted);
}

/* Attendance Pills */
.adb-fake-pills {
  display: flex;
  gap: 8px;
}
.adb-fake-pill {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
}
.adb-fake-pill.green {
  background: #f0fdf4;
  color: #16a34a;
  border-left: 3px solid #16a34a;
}
.adb-fake-pill.gray {
  background: var(--clr-surface-2);
  color: var(--clr-text-muted);
  border-left: 3px solid var(--clr-border);
}

@media (max-width: 640px) {
  .adb-modules-grid { grid-template-columns: 1fr; padding: 0 1rem; }
}
`;
  cssContent += newCSS;
  fs.writeFileSync('src/components/AdminEvents.css', cssContent);
  console.log("Successfully updated AdminEvents.css");
} else {
  console.log("Could not find exact CSS target in AdminEvents.css");
}
