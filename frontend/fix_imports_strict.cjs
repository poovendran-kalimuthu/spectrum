const fs = require('fs');

let c1 = fs.readFileSync('src/components/AdminEvents.jsx', 'utf8').split('\n');
c1.splice(0, 15, `import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';
import { API_URL } from '../config';
import './AdminEvents.css';
import './EventCard.css';
import Select from './ui/Select';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,`);
fs.writeFileSync('src/components/AdminEvents.jsx', c1.join('\n'));

let c2 = fs.readFileSync('src/components/AdminEventDetail.jsx', 'utf8').split('\n');
c2.splice(0, 15, `import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import Loader from './Loader';
import './AdminEvents.css'; 
import EventCountdown from './EventCountdown';
import Select from './ui/Select';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, `);
fs.writeFileSync('src/components/AdminEventDetail.jsx', c2.join('\n'));

console.log('Fixed exactly!');
