import dotenv from 'dotenv';
dotenv.config();
import { google } from 'googleapis';

async function testMeet() {
  try {
    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/calendar']
    });

    const calendar = google.calendar({ version: 'v3', auth });
    
    console.log("Attempting to insert event...");
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: {
        summary: "Test Meeting",
        start: { dateTime: new Date().toISOString(), timeZone: 'Asia/Kolkata' },
        end: { dateTime: new Date(Date.now() + 3600000).toISOString(), timeZone: 'Asia/Kolkata' },
        conferenceData: {
          createRequest: {
            requestId: Math.random().toString(36).substring(7),
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        }
      },
      conferenceDataVersion: 1
    });

    console.log("Success! Meet Link:", response.data.hangoutLink);
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testMeet();
