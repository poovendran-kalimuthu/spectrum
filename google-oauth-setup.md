# Google OAuth 2.0 Setup Guide for Node.js / Express

This guide explains how to set up the Google Cloud Console credentials and implement the OAuth 2.0 flow using Passport.js.

## Step 1: Set Up Google Cloud Console

1. **Go to the Google Cloud Console**: Navigate to [https://console.cloud.google.com/](https://console.cloud.google.com/).
2. **Create a New Project**:
   - Click the project dropdown near the top-left logo.
   - Click "New Project" and give it a name like `Spectrum Auth`.
   - Click "Create".
3. **Configure OAuth Consent Screen**:
   - In the sidebar, go to **APIs & Services** > **OAuth consent screen**.
   - Choose **External** (if this is for anyone with a Google account) or **Internal** (if restricted to your Google Workspace).
   - Fill in the required app details (App name, Support email, Developer contact).
   - Click **Save and Continue** until you reach the summary, then click **Back to Dashboard**.
4. **Create Credentials**:
   - Go to **APIs & Services** > **Credentials**.
   - Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Spectrum Web Client`.
   - **Authorized JavaScript origins**: `http://127.0.0.1:5500` (or `http://localhost:3000` depending on where your frontend runs).
   - **Authorized redirect URIs**: `http://127.0.0.1:5000/api/auth/google/callback` (must exactly match the callback route in your backend).
   - Click **Create**.
5. **Get your Keys**:
   - Copy the **Client ID** and **Client Secret**.
   - Open your `backend/.env` file and paste them into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## Step 2: Install Dependencies

Make sure you run the following in your `backend` directory:
```bash
npm install express mongoose dotenv cors express-session passport passport-google-oauth20
```

## Step 3: Start Services

1. Open your terminal in the backend directory.
2. Run `npm run dev` to start your Node.js server using nodemon. (Don't forget to have MongoDB running locally, or change `MONGO_URI` to a MongoDB Atlas URL).
3. Host the `frontend` folder using Live Server (usually port 5500).
4. Navigate to `http://127.0.0.1:5500/index.html` and click "Sign in with Google".

## Brief Explanation of Architecture:

1. **Frontend Initiation**: The user clicks the login link which issues a `GET` request to `/api/auth/google`.
2. **Passport Authentication**: At that route, Passport.js redirects the user to Google's consent screen.
3. **Google Callback**: After the user consents, Google redirects them back to `/api/auth/google/callback` passing an authorization code.
4. **Passport Strategy (`config/passport.js`)**: Passport trades the code for tokens, gets user info (`profile`), and fires the callback function we wrote. Inside the callback, we check if the `googleId` exists in our specific MongoDB schema. If not, we create a new user document.
5. **Sessions**: `passport.serializeUser` saves the `user.id` into the `express-session` storage. The session cookie (`connect.sid`) is returned to the user's browser.
6. **Protecting Routes**: Custom middleware (`authMiddleware.js`) asks Passport's `req.isAuthenticated()` if a valid session exists. If so, logic proceeds. Otherwise, a 401 error fires.
7. **Frontend Validation**: `dashboard.html` makes an API call equipped with `{ credentials: 'include' }` to hit a backend route checking login state (`/api/auth/login/success`). This ensures sensitive UI is only loaded for truly logged-in parties.

*Note: For production, ensure you manage CORS tightly, utilize `secure: true` on your cookies alongside HTTPS, and provide a proper cloud database URI.*
