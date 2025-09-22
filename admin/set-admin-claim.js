const admin = require('firebase-admin');
// Update the path if your service account key is stored elsewhere
const serviceAccount = require('./service-account-key.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://connect-c6b59.firebaseio.com'
});

// Replace with your admin email
const email = 'harnammasale@gmail.com';

// Set admin claim
admin.auth().getUserByEmail(email)
  .then((user) => {
    return admin.auth().setCustomUserClaims(user.uid, { admin: true });
  })
  .then(() => {
    console.log(`Success! ${email} is now an admin.`);
    process.exit();
  })
  .catch((error) => {
    console.log('Error:', error);
    process.exit(1);
  });
