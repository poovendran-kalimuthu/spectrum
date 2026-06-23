import React, { useState, useEffect } from 'react';
import { User, Bell, Shield, Paintbrush, Globe, Key, Smartphone, Trash2, Link, Check, Loader2, MapPin, Plus } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../config';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    language: 'English (US)',
    timezone: 'IST (Indian Standard Time)',
    emailNotifications: true,
    pushNotifications: false,
    eventUpdates: true,
    theme: 'System',
    compactMode: false
  });
  const [venues, setVenues] = useState([]);
  const [newVenue, setNewVenue] = useState({ name: '', latitude: '', longitude: '', radius: 50 });
  const [loadingVenues, setLoadingVenues] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/auth/login/success`);
        if (res.data.success && res.data.user.settings) {
          setSettings(prev => ({ ...prev, ...res.data.user.settings }));
        }
      } catch (err) {
        console.error('Failed to fetch user settings', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchVenues = async () => {
      try {
        setLoadingVenues(true);
        const res = await axios.get(`${API_URL}/api/venues`);
        if (res.data.success) {
          setVenues(res.data.venues);
        }
      } catch (err) {
        console.error('Failed to fetch venues', err);
      } finally {
        setLoadingVenues(false);
      }
    };

    fetchSettings();
    fetchVenues();
  }, []);

  const handleSettingChange = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/users/settings`, { [key]: value });
    } catch (err) {
      console.error('Failed to update setting', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/venues`, {
        name: newVenue.name,
        latitude: parseFloat(newVenue.latitude),
        longitude: parseFloat(newVenue.longitude),
        radius: parseInt(newVenue.radius)
      });
      if (res.data.success) {
        setVenues([res.data.venue, ...venues]);
        setNewVenue({ name: '', latitude: '', longitude: '', radius: 50 });
      }
    } catch (err) {
      console.error('Failed to create venue', err);
    }
  };

  const handleDeleteVenue = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/venues/${id}`);
      setVenues(venues.filter(v => v._id !== id));
    } catch (err) {
      console.error('Failed to delete venue', err);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Paintbrush },
    { id: 'integrations', label: 'Integrations', icon: Link },
    { id: 'venues', label: 'Venues & GPS', icon: MapPin },
  ];

  return (
    <div className="stg-container page-enter">
      <div className="stg-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1>Settings</h1>
          {saving && <Loader2 size={18} className="animate-spin" style={{ color: '#64748b' }} />}
        </div>
        <p>Manage your account settings and preferences.</p>
      </div>

      <div className="stg-layout">
        <aside className="stg-sidebar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`stg-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </aside>

        <main className="stg-content">
          {activeTab === 'general' && (
            <div className="stg-section animate-fade-in">
              <h2>General Preferences</h2>
              <div className="stg-card">
                <div className="stg-row">
                  <div className="stg-info">
                    <h4>Language</h4>
                    <p>Select your preferred language for the dashboard.</p>
                  </div>
                  <select 
                    className="form-select stg-select"
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>
                <div className="stg-row">
                  <div className="stg-info">
                    <h4>Timezone</h4>
                    <p>Used for event schedules and deadlines.</p>
                  </div>
                  <select 
                    className="form-select stg-select"
                    value={settings.timezone}
                    onChange={(e) => handleSettingChange('timezone', e.target.value)}
                  >
                    <option value="UTC (Coordinated Universal Time)">UTC (Coordinated Universal Time)</option>
                    <option value="IST (Indian Standard Time)">IST (Indian Standard Time)</option>
                    <option value="EST (Eastern Standard Time)">EST (Eastern Standard Time)</option>
                  </select>
                </div>
              </div>

              <h2>Data Management</h2>
              <div className="stg-card danger-zone">
                <div className="stg-row">
                  <div className="stg-info">
                    <h4>Export Account Data</h4>
                    <p>Download a copy of your personal data.</p>
                  </div>
                  <button className="btn btn-outline">Export Data</button>
                </div>
                <div className="stg-row">
                  <div className="stg-info">
                    <h4 className="text-danger">Delete Account</h4>
                    <p>Permanently remove your account and all associated data.</p>
                  </div>
                  <button className="btn btn-danger">Delete Account</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="stg-section animate-fade-in">
              <h2>Notification Preferences</h2>
              <div className="stg-card">
                <div className="stg-row toggle-row">
                  <div className="stg-info">
                    <h4>Email Notifications</h4>
                    <p>Receive daily summaries and critical alerts.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="stg-toggle" 
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  />
                </div>
                <div className="stg-row toggle-row">
                  <div className="stg-info">
                    <h4>Push Notifications</h4>
                    <p>Receive real-time alerts in your browser.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="stg-toggle" 
                    checked={settings.pushNotifications}
                    onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                  />
                </div>
                <div className="stg-row toggle-row">
                  <div className="stg-info">
                    <h4>Event Updates</h4>
                    <p>Get notified when an event schedule changes.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="stg-toggle" 
                    checked={settings.eventUpdates}
                    onChange={(e) => handleSettingChange('eventUpdates', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="stg-section animate-fade-in">
              <h2>Security Settings</h2>
              <div className="stg-card">
                <div className="stg-row">
                  <div className="stg-info">
                    <h4>Change Password</h4>
                    <p>Update your account password.</p>
                  </div>
                  <button className="btn btn-outline">Update Password</button>
                </div>
                <div className="stg-row toggle-row">
                  <div className="stg-info">
                    <h4>Two-Factor Authentication (2FA)</h4>
                    <p>Add an extra layer of security to your account.</p>
                  </div>
                  <button className="btn btn-primary">Enable 2FA</button>
                </div>
              </div>
              
              <h2>Active Sessions</h2>
              <div className="stg-card">
                <div className="stg-row session-row">
                  <div className="stg-info">
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                      <Smartphone size={16} />
                      <h4>Windows 11 • Chrome</h4>
                      <span className="stg-badge success">Current Session</span>
                    </div>
                    <p>Chennai, India • Active now</p>
                  </div>
                </div>
                <div className="stg-row session-row">
                  <div className="stg-info">
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                      <Smartphone size={16} />
                      <h4>iPhone 14 Pro • Safari</h4>
                    </div>
                    <p>Bangalore, India • Last active 2 hours ago</p>
                  </div>
                  <button className="btn btn-outline btn-sm">Revoke</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="stg-section animate-fade-in">
              <h2>Appearance</h2>
              <div className="stg-card">
                <div className="stg-row">
                  <div className="stg-info">
                    <h4>Theme Selection</h4>
                    <p>Choose between light, dark, or system default.</p>
                  </div>
                  <div className="stg-theme-selector">
                    <button 
                      className={`stg-theme-btn ${settings.theme === 'System' ? 'active' : ''}`}
                      onClick={() => handleSettingChange('theme', 'System')}
                    >System</button>
                    <button 
                      className={`stg-theme-btn ${settings.theme === 'Light' ? 'active' : ''}`}
                      onClick={() => handleSettingChange('theme', 'Light')}
                    >Light</button>
                    <button 
                      className={`stg-theme-btn ${settings.theme === 'Dark' ? 'active' : ''}`}
                      onClick={() => handleSettingChange('theme', 'Dark')}
                    >Dark</button>
                  </div>
                </div>
                <div className="stg-row toggle-row">
                  <div className="stg-info">
                    <h4>Compact Mode</h4>
                    <p>Reduce padding to fit more content on screen.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="stg-toggle" 
                    checked={settings.compactMode}
                    onChange={(e) => handleSettingChange('compactMode', e.target.checked)}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="stg-section animate-fade-in">
              <h2>Connected Apps</h2>
              <div className="stg-card">
                <div className="stg-row">
                  <div className="stg-info" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="stg-icon-box" style={{ background: '#000', color: '#fff' }}>
                      <Link size={20} />
                    </div>
                    <div>
                      <h4>GitHub Account</h4>
                      <p>Connect GitHub to pull repository data for submissions.</p>
                    </div>
                  </div>
                  <button className="btn btn-primary">Connect</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'venues' && (
            <div className="stg-section animate-fade-in">
              <h2>GPS Attendance Venues</h2>
              <div className="stg-card" style={{ padding: '1.5rem' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Add New Venue</h4>
                <form onSubmit={handleCreateVenue} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '2rem' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Venue Name</label>
                    <input type="text" className="form-input stg-select" style={{ width: '100%' }} placeholder="e.g., Main Auditorium" value={newVenue.name} onChange={e => setNewVenue({...newVenue, name: e.target.value})} required />
                  </div>
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Latitude</label>
                    <input type="number" step="any" className="form-input stg-select" style={{ width: '100%' }} placeholder="e.g., 12.9716" value={newVenue.latitude} onChange={e => setNewVenue({...newVenue, latitude: e.target.value})} required />
                  </div>
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Longitude</label>
                    <input type="number" step="any" className="form-input stg-select" style={{ width: '100%' }} placeholder="e.g., 77.5946" value={newVenue.longitude} onChange={e => setNewVenue({...newVenue, longitude: e.target.value})} required />
                  </div>
                  <div style={{ flex: '1 1 100px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Radius (m)</label>
                    <input type="number" className="form-input stg-select" style={{ width: '100%' }} placeholder="50" value={newVenue.radius} onChange={e => setNewVenue({...newVenue, radius: e.target.value})} required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.25rem', height: '42px' }}>
                    <Plus size={16} /> Add Venue
                  </button>
                </form>

                <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>Configured Venues</h4>
                {loadingVenues ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Loading venues...</div>
                ) : venues.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                    No venues configured.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {venues.map(venue => (
                      <div key={venue._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <div>
                          <h5 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', color: '#0f172a' }}>{venue.name}</h5>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '1rem' }}>
                            <span>Lat: {venue.latitude}</span>
                            <span>Lng: {venue.longitude}</span>
                            <span>Radius: {venue.radius}m</span>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteVenue(venue._id)} className="btn btn-outline" style={{ color: '#dc2626', borderColor: '#fecaca', padding: '0.4rem 0.6rem' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;
