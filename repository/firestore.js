const admin             = require('firebase-admin');
// const serviceAccount    = require('../service_account.json');
const serviceAccount    = require('../knife-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db               = admin.firestore();

//--------------------------------------------data user-----------------------------------------
exports.FSInitDataUser = (keyCollection, keyDoc, data) => {
  try {
    db.collection(keyCollection)
      .doc(keyDoc)
      .set(data);
  }
  catch(err) {
    console.log(err);
  }
}

exports.FSGetTurnAndInven = async (keyCollection) => {
  try {
    const dataUser  = db.collection(keyCollection).doc('turn_inven');
    const doc       = await dataUser.get();
    if (!doc.exists) {
      return null;
    }
    return doc.data();
  }
  catch(err) {
    return null;
  }
}

exports.FSUpdateTokenUser = (keyCollection, token) => {
  try {
    const dataUser = db.collection(keyCollection).doc('turn_inven');
    dataUser.update({
      'token': token
    });
  }
  catch(err) {
    console.log(err);
  }
}

//--------------------------------------------admin--------------------------------------------
exports.FSUpdatePartition = (data) => {
  try {
    db.collection('admin')
      .doc('partition')
      .set(data);
  }
  catch(err) {
    console.log(err);
  }
}

exports.FSGetPartition = async () => {
  try {
    const admin = db.collection('admin').doc('partition');
    const data  = await admin.get();
    if (!data.exists) return null;
    return data.data();
  }
  catch(err) {
    console.log(err);
    return null;
  }
}