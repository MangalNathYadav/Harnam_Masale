// Firebase configuration for Harnam Masale

// Initialize Firebase with your config
const firebaseConfig = {
    apiKey: "AIzaSyCSLhBoEVhIlNC4Nx029rg3aWZZzNNE2C4",
    authDomain: "connect-c6b59.firebaseapp.com",
    databaseURL: "https://connect-c6b59.firebaseio.com",
    projectId: "connect-c6b59",
    storageBucket: "connect-c6b59.firebasestorage.app",
    messagingSenderId: "26762071119",
    appId: "1:26762071119:web:b105eff50bedd663306e3a",
    measurementId: "G-XKQDCTC9PD"
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