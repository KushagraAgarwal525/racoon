# Racoon Productivity Tracker

A productivity tracker that uses AI to analyze your computer usage patterns.

## Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Set up environment variables (see below)
4. Run `npm run dev` to start the development server

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Getting a Google Client ID

To enable Google Sign-In:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Add your application's domain to the "Authorized JavaScript origins" (e.g., http://localhost:3000)
7. Add your redirect URI to "Authorized redirect URIs" (e.g., http://localhost:3000/api/auth/callback/google)
8. Click "Create"
9. Copy the generated Client ID and add it to your `.env.local` file

## Server Setup

The Racoon server needs to be running for authentication and data storage.

1. Navigate to the `server` directory: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file with the following Firebase configuration:

```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
PORT=3000
```

4. Start the server: `npm run dev`

## Features

- Track your productivity throughout the day
- AI-powered categorization of applications
- Productivity statistics and insights
- History tracking and reporting

## Current Features
 - Daily Productivity Pie Chart
 - Weekly Productivity Bar Graph
 - Daily Productivity Leaderboard

Any data on the dashboard is updated every minute.
