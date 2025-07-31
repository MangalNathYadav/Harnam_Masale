// =============== Okay, so this is the Firebase config for Harnam Masale. Seriously, don't touch it unless you totally know what you're doing! ===============

// =============== Setting up Firebase with our secret sauce config, fingers crossed nothing breaks ===============
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL
};

// Warn if any env variable is missing
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value) {
    console.warn(`Firebase config missing env variable: ${key}`);
  }
});

// =============== Time to actually fire up Firebase, let's hope it works! ===============
firebase.initializeApp(firebaseConfig);

// =============== Grabbing the Firebase services so we can use them everywhere in the app, like magic ===============
const auth = firebase.auth();
const database = firebase.database();

// =============== Making these Firebase things global so we don't have to keep importing them all over the place ===============
window.auth = auth;
window.database = database;

// =============== Utility functions for Firebase go below, just copy from desktop if you need more (no shame in copy-paste) ===============