// =============== Okay, so this is the Firebase config for Harnam Masale. Seriously, don't touch it unless you totally know what you're doing! ===============

// =============== Setting up Firebase with our secret sauce config, fingers crossed nothing breaks ===============
const firebaseConfig = {
  apiKey: "AIzaSyCpj8g6Co_voHq2WeUAVAi7cjlzmAwOrJI",
  authDomain: "harnamfoods-b725c.firebaseapp.com",
  projectId: "harnamfoods-b725c",
  storageBucket: "harnamfoods-b725c.firebasestorage.app",
  messagingSenderId: "614833536175",
  appId: "1:614833536175:web:99284cae6c5f5543d8e85a",
  measurementId: "G-G2THN82DSY"
};

// =============== Time to actually fire up Firebase, let's hope it works! ===============
firebase.initializeApp(firebaseConfig);

// =============== Grabbing the Firebase services so we can use them everywhere in the app, like magic ===============
const auth = firebase.auth();
const database = firebase.database();

// =============== Making these Firebase things global so we don't have to keep importing them all over the place ===============
window.auth = auth;
window.database = database;

// =============== Utility functions for Firebase go below, just copy from desktop if you need more (no shame in copy-paste) ===============