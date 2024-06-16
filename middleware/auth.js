const User = require('../models/user/userModel');
const admin = require('./firebaseAdmin');


exports.protect = async (req, res, next) => {
    // 1) Getting token and check if it's there
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        console.log(token);
        const decodedToken = await admin.auth().verifyIdToken(token);
        console.log('Decoded Token:', decodedToken);

    }
    if (!token) {
        return res.status(401).json({ message: "You are not logged in! Please log in to get access" });
    }

    try {
        // 2) Verify token with Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(token);

        // 3) Check if user still exists

        const currentUser = await User.findById(decodedToken.uid);
        //const currentUser = await User.findOne({ firebaseId: decodedToken.uid });
        console.log(decodedToken.uid);
        console.log(currentUser);
        if (!currentUser) {
            return res.status(401).json({ message: "The user belonging to this token does not exist" });
        }

        // Grant Access to protected route
        req.user = currentUser;
        req.userId = decodedToken.uid; // Збереження uid користувача
        console.log(decodedToken.uid);

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

