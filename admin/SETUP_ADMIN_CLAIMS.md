# Setting Up Admin Authentication for Harnam Masale CMS

The Harnam Masale CMS uses Firebase Authentication with custom claims to restrict access to admin-only features. This document explains how to set up admin authentication.

## Prerequisites

1. Access to the Firebase project console
2. Admin account created in Firebase Authentication (typically admin@domain.com)

## How to Set Admin Claims

Since Firebase custom claims can only be set from a privileged environment (not client-side code), you'll need to use one of the following methods:

### Method 1: Using Firebase CLI (Recommended)

1. Install the Firebase CLI if you haven't already:
   ```bash
   npm install -g firebase-tools
   ```

2. Log in to your Firebase account:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init
   ```

4. Create a script file named `set-admin-claim.js` in your project root:
   ```javascript
   const admin = require('firebase-admin');
   const serviceAccount = require('./service-account-key.json'); // Download this from Firebase console

   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount),
     databaseURL: 'https://connect-c6b59.firebaseio.com'
   });

   // The email of the user you want to make an admin
   const email = 'admin@domain.com';

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
   ```

5. Download your service account key:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the file as `service-account-key.json` in your project root

6. Run the script:
   ```bash
   node set-admin-claim.js
   ```

### Method 2: Using Firebase Console and Cloud Functions

1. Create a simple HTTP Cloud Function:
   ```javascript
   const functions = require('firebase-functions');
   const admin = require('firebase-admin');
   admin.initializeApp();

   exports.addAdminRole = functions.https.onCall((data, context) => {
     // Check if request is made by an admin
     if (context.auth.token.admin !== true) {
       return { error: 'Only admins can add other admins' };
     }
     
     // Get user and add custom claim
     return admin.auth().getUserByEmail(data.email)
       .then(user => {
         return admin.auth().setCustomUserClaims(user.uid, {
           admin: true
         });
       })
       .then(() => {
         return {
           message: `Success! ${data.email} has been made an admin.`
         };
       })
       .catch(err => {
         return { error: err.message };
       });
   });

   // For setting up the first admin
   exports.setupFirstAdmin = functions.https.onRequest((req, res) => {
     // Use a secret key to protect this endpoint
     const key = req.query.key;
     if (key !== 'YOUR_SECRET_KEY') {
       res.status(401).send('Unauthorized');
       return;
     }

     const email = req.query.email || 'admin@domain.com';
     
     admin.auth().getUserByEmail(email)
       .then(user => {
         return admin.auth().setCustomUserClaims(user.uid, {
           admin: true
         });
       })
       .then(() => {
         res.send(`Success! ${email} is now an admin.`);
       })
       .catch(err => {
         res.status(500).send(`Error: ${err.message}`);
       });
   });
   ```

2. Deploy the function:
   ```bash
   firebase deploy --only functions
   ```

3. For the first admin, visit:
   ```
   https://us-central1-your-project-id.cloudfunctions.net/setupFirstAdmin?key=YOUR_SECRET_KEY&email=admin@domain.com
   ```

4. For subsequent admins, create an admin interface that calls the `addAdminRole` function.

## Verifying Admin Status

Our system is already set up to verify admin claims when a user logs in. The admin-auth.js file checks for the custom claim and redirects non-admins away from the admin pages.

## Security Rules

The Firebase Realtime Database security rules have been updated to protect admin-only resources. These rules check for the `auth.token.admin` claim before allowing read/write operations.

## Testing Admin Authentication

1. Log in to the admin panel using your admin account (the one you've set the admin claim for)
2. The system should automatically verify your admin status and allow access
3. Try logging in with a non-admin account - you should be denied access

## Troubleshooting

- **User can't access admin panel despite having admin claim**: Try logging out and back in to refresh the auth token
- **Changes to security rules not taking effect**: It can take a few minutes for rule changes to propagate
- **Error setting custom claims**: Make sure you're using a service account with sufficient privileges

For any further assistance, please contact the developer.
