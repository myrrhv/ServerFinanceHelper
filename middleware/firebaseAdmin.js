const admin = require('firebase-admin');
const serviceAccount = require('../finance-helper.json');

console.log('Initializing Firebase Admin SDK...');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://finance-helper-auth.firebaseio.com'
});

console.log('Firebase Admin SDK initialized successfully!');
module.exports = admin;

