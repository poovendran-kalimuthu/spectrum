import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
 
// Essential for cross-site cookies between Vercel and Render
axios.defaults.withCredentials = true;
axios.defaults.headers.common['ngrok-skip-browser-warning'] = 'true';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
