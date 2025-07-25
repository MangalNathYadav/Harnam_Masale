// Firebase configuration for Harnam Masale

// Initialize Firebase with your config
const firebaseConfig = {
  apiKey: "AIzaSyCpj8g6Co_voHq2WeUAVAi7cjlzmAwOrJI",
  authDomain: "harnamfoods-b725c.firebaseapp.com",
  projectId: "harnamfoods-b725c",
  storageBucket: "harnamfoods-b725c.firebasestorage.app",
  messagingSenderId: "614833536175",
  appId: "1:614833536175:web:99284cae6c5f5543d8e85a",
  measurementId: "G-G2THN82DSY"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Make services available globally
window.auth = auth;
window.database = database;

// Firebase utility functions (copy the rest of the utility code from js/firebase-config.js as needed)
// ... (copy the rest of the file as in js/firebase-config.js) ...