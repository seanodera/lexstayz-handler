const admin = require("firebase-admin");
const {firebaseConfig} = require("../configs/firebaseConfig");
const isDev = process.env.STAGE === 'dev'
const options =  {
    credential: admin.credential.cert(firebaseConfig),
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

