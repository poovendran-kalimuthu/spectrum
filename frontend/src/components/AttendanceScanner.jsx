import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { API_URL } from '../config';

const AttendanceScanner = ({ eventId, onComplete, onCancel, isAdminScanner = false, initialRound = 1, eventRounds = 1 }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedRound, setSelectedRound] = useState(initialRound);
  const scannerRef = useRef(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      // Check for Secure Context
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        setError("Camera requires HTTPS. Please ensure you're using the secure ngrok link.");
        return;
      }

      setError('');
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, 
          {
            fps: 10,
            qrbox: (viewWidth, viewHeight) => {
               let sideLength = Math.min(viewWidth, viewHeight) * 0.7;
               return { width: sideLength, height: sideLength };
            }
          },
          async (decodedText) => {
            try {
              const data = JSON.parse(decodedText);
              
              setLoading(true);
              let res;
              
              if (isAdminScanner) {
                // Admin mode: scanning participant QR
                if (data.type !== 'participant' || data.eventId !== eventId) {
                  setError('Invalid participant QR for this event.');
                  setLoading(false);
                  return;
                }
                res = await axios.post(`${API_URL}/api/attendance/admin-scan`, {
                  registrationId: data.registrationId,
                  eventId: eventId,
                  round: selectedRound // Using internal state
                }, { withCredentials: true });
              } else {
                // Student mode: scanning session QR
                if (data.eventId !== eventId) {
                  setError('Invalid QR code for this event.');
                  setLoading(false);
                  return;
                }
                res = await axios.post(`${API_URL}/api/attendance/checkin`, {
                  eventId: data.eventId,
                  sessionToken: data.sessionToken
                }, { withCredentials: true });
              }

              if (res.data.success) {
                setSuccess(res.data.message || 'Check-in successful!');
                await html5QrCode.stop();
                setTimeout(() => onComplete(res.data.message), 1500);
              }
            } catch (err) {
              console.error('Scan processing error:', err);
              setError(err.response?.data?.message || 'Verification failed. Try again.');
              setLoading(false);
            }
          },
          (errorMessage) => {
            // silent scan errors
          }
        );
        setIsStarted(true);
      } catch (err) {
        console.error("Camera start error:", err);
        setError("Camera blocked or error occurred. Please click 'Try Camera' or use the Upload option.");
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(e => console.error("Stop error", e));
      }
    };
  }, [eventId]);

  const handleFileUpload = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);
      setError('');
      
      try {
        const image = new Image();
        const reader = new FileReader();
        
        reader.onload = (event) => {
          image.onload = async () => {
             try {
                // Manual Downscaling via Canvas
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Max dimension for reliable QR scanning
                const MAX_WIDTH = 1000;
                const MAX_HEIGHT = 1000;
                let width = image.width;
                let height = image.height;

                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                  }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(image, 0, 0, width, height);

                // Convert canvas back to Blob for scanning
                canvas.toBlob(async (blob) => {
                  try {
                    const decodedText = await scannerRef.current.scanFile(blob, false);
                    const data = JSON.parse(decodedText);
                    
                    setLoading(true);
                    let res;

                    if (isAdminScanner) {
                      // Admin mode: scanning participant QR
                      if (data.type !== 'participant' || data.eventId !== eventId) {
                        setError('Invalid participant QR for this event.');
                        setLoading(false);
                        setIsUploading(false);
                        return;
                      }
                      res = await axios.post(`${API_URL}/api/attendance/admin-scan`, {
                        registrationId: data.registrationId,
                        eventId: eventId,
                        round: selectedRound // Using internal state
                      }, { withCredentials: true });
                    } else {
                      // Student mode: scanning session QR
                      if (data.eventId !== eventId) {
                        setError('Invalid QR code for this event.');
                        setLoading(false);
                        setIsUploading(false);
                        return;
                      }
                      res = await axios.post(`${API_URL}/api/attendance/checkin`, {
                        eventId: data.eventId,
                        sessionToken: data.sessionToken
                      }, { withCredentials: true });
                    }

                    if (res.data.success) {
                      setSuccess(res.data.message || 'Check-in successful!');
                      setTimeout(() => onComplete(res.data.message), 1500);
                    }
                  } catch (scanErr) {
                    console.error("Manual scan error:", scanErr);
                    setError('No QR code detected. Make sure the code fills the screen, is well-lit, and not blurry.');
                    setIsUploading(false);
                  }
                }, 'image/jpeg', 0.8);
             } catch (err) {
               console.error("Canvas processing error:", err);
               setError('Error processing image. Please try again.');
               setIsUploading(false);
             }
          };
          image.src = event.target.result;
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("File reading error:", err);
        setError('Error reading file. Please try again.');
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="scanner-modal glass-strong animate-fade-in">
      <div className="scanner-header">
        <h3>Verify Attendance</h3>
        <button className="btn btn-ghost btn-xs" onClick={onCancel}>✕ Close</button>
      </div>
      
      <div className="scanner-body">
        {isAdminScanner && (
          <div className="ae-scanner-round-selector-inner">
            <span className="selector-label">Target Round:</span>
            <div className="selector-btns">
              {[...Array(eventRounds)].map((_, i) => (
                <button 
                  key={i} 
                  className={`selector-btn ${selectedRound === i + 1 ? 'active' : ''}`}
                  onClick={() => setSelectedRound(i + 1)}
                >
                  R{i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {success ? (
          <div className="scanner-success">
            <span className="success-icon">✅</span>
            <p className="success-text">{success}</p>
          </div>
        ) : (
          <div className="scanner-layout">
            <div className="scanner-view-container">
              {!isStarted && !error && !isUploading && (
                <div className="camera-loading">
                  <div className="spinner"></div>
                  <span>Loading Camera...</span>
                </div>
              )}
              <div id="reader"></div>
              
              {error && <div className="scanner-error-float">{error}</div>}
              {(loading || isUploading) && <div className="scanner-status-overlay">Verifying...</div>}
            </div>

            <div className="scanner-divider">
              <span>OR</span>
            </div>

            <div className="scanner-actions">
              <label className="btn btn-primary btn-block btn-lg shadow-lg">
                📸 Take Photo / Upload QR
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                />
              </label>
              <p className="scanner-hint">Use this if the camera doesn't load above</p>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .scanner-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 95%;
          max-width: 450px;
          height: auto;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          background: #0d0f1a;
          border-radius: 24px;
          z-index: 2100;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Native Fullscreen on Mobile */
        @media (max-width: 600px) {
          .scanner-modal {
            width: 100% !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            max-width: none !important;
            border-radius: 0 !important;
            top: 0 !important;
            left: 0 !important;
            transform: none !important;
            border: none !important;
          }
        }

        .scanner-header {
           padding: 1rem 1.5rem;
           display: flex;
           justify-content: space-between;
           align-items: center;
           background: rgba(0,0,0,0.5);
           border-bottom: 1px solid rgba(255,255,255,0.05);
           z-index: 50;
        }
        .scanner-header h3 { font-size: 1.1rem; margin: 0; color: #fff; font-weight: 700; }
        
        .scanner-body { 
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          padding: 1.5rem;
          background: #0d0f1a;
          overflow-y: auto;
        }

        .scanner-layout {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: 100%;
        }
        
        .scanner-view-container { 
          position: relative; 
          width: 100%; 
          aspect-ratio: 1.2;
          min-height: 250px;
          background: #000;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.05);
        }

        #reader { width: 100% !important; height: 100% !important; border: none !important; }
        #reader video { object-fit: cover !important; width: 100% !important; height: 100% !important; }

        .scanner-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: rgba(255,255,255,0.3);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.1rem;
        }
        .scanner-divider::before, .scanner-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.1);
        }

        .scanner-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          text-align: center;
        }
        .scanner-hint { font-size: 0.8rem; color: var(--clr-text-muted); }

        .scanner-error-float {
          position: absolute;
          top: 1rem;
          left: 1rem;
          right: 1rem;
          background: rgba(239, 68, 68, 0.9);
          color: #fff;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          z-index: 20;
          text-align: center;
        }

        .scanner-status-overlay {
          position: absolute;
          inset: 0;
          background: rgba(99, 102, 241, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 1.2rem;
          font-weight: 700;
          z-index: 30;
        }

        .scanner-success { 
          text-align: center; 
          padding: 3rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .success-icon { font-size: 4.5rem; display: block; margin-bottom: 1.5rem; }
        .success-text { color: #10b981; font-weight: 800; font-size: 1.4rem; }
        
        .ae-scanner-round-selector-inner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 15px;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          margin-bottom: 15px;
          border: 1px solid rgba(255,255,255,0.08);
          flex-wrap: wrap;
          justify-content: center;
        }
        .selector-label { font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.5); text-transform: uppercase; }
        .selector-btns { display: flex; gap: 8px; flex-wrap: wrap; }
        .selector-btn {
          background: rgba(255,255,255,0.1);
          color: #fff;
          border: none;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .selector-btn.active {
          background: #6366f1;
          box-shadow: 0 0 15px rgba(99,102,241,0.4);
        }
        
        @keyframes popIn {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
};

export default AttendanceScanner;
