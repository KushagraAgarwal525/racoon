import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Check if app has been initialized
let firebaseAdmin: admin.app.App;

try {
  firebaseAdmin = admin.app();
} catch (error) {
  // Initialize with service account if available
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (e) {
      console.error("Error parsing service account key:", e);
      // Fall back to default initialization
      firebaseAdmin = admin.initializeApp();
    }
  } else {
    // Initialize with application default credentials
    firebaseAdmin = admin.initializeApp();
  }
}

// Initialize Firestore
const db = firebaseAdmin.firestore();

// Export FieldValue separately for easier access
const fieldValue = admin.firestore.FieldValue;

export { firebaseAdmin as default, db, fieldValue };
