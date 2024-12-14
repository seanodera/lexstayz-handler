const admin = require("firebase-admin");
const serviceAccount = require("../configs/service_config.json");
const databaseId = "development"; // Replace with your database ID
const isDev = process.env.STAGE === 'dev'
// Initialize Firebase Admin SDK with service account credentials and custom database URL
const options =  {
    credential: admin.credential.cert(serviceAccount),
}
admin.initializeApp(options);


if (isDev){
    admin.firestore().settings({
        databaseId: 'development',
    })
}



const db = admin.firestore()
console.log(db.databaseId)
exports.firestore = db;

// const isDev = process.env.STAGE === 'dev';
// exports.firestore = isDev
//     ? initializeFirestore(admin.app, {}, 'development')
//     : initializeFirestore(admin.app, {});

