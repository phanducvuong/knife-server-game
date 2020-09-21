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

exports.FSUpdateHistoryUser = (keyCollection, data) => {
  const history = db.collection(keyCollection).doc('histories');
  history.update({
    'his': admin.firestore.FieldValue.arrayUnion(data)
  })
  .then(result => {})
  .catch(async (err) => {
    let doc = await history.get();
    if (!doc.exists) {
      let arrHis = [];
      arrHis.push(data);
      history.set({ 'his': arrHis });
    }
  });
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

exports.FSUpdateSupportItem = (data) => {
  try {
    db.collection('admin')
      .doc('supporting_item')
      .set({ support_item: data });
  }
  catch(err) {
    console.log(err);
  }
}

exports.FSGetSupportItem = async () => {
  try {
    const admin = db.collection('admin').doc('supporting_item');
    const data  = await admin.get();

    if (!data.exists) return null;
    return data.data()['support_item'];
  }
  catch(err) {
    console.log(err);
    return null;
  }
}

exports.FSGetItemBy = async (keyDoc) => {
  try {
    const admin = db.collection('items').doc(`${keyDoc}`);
    const data  = await admin.get();

    if (!data.exists) return null;
    return data.data();
  }
  catch(err) {
    console.log(err);
    return null;
  }
}

exports.FSUpdateARRItemBy = (keyDoc, data) => {
  try {
    db.collection('items')
      .doc(`${keyDoc}`)
      .set(data);
  }
  catch(err) {
    console.log(err);
  }
}

exports.FSDeleteItemBy = async (keyDoc) => {
  try {
    const res = await db.collection('items').doc(`${keyDoc}`).delete();
  }
  catch(err) {
    console.log(err);
  }
}

exports.FSGetAllItem = async () => {
  try {
    let   arrKeyItem  = [];
    const itemKey     = await db.collection('items').get();
    for (e of itemKey.docs) {
      arrKeyItem.push(e.data());
    }
    return arrKeyItem;
  }
  catch(err) {
    console.log(err);
    return null;
  }
}

exports.FSIncrAmountItem = (item, incr) => {
  const itemRef = db.collection('items').doc(`${item['id']}`);
  itemRef.update({
    'amount' : admin.firestore.FieldValue.increment(incr)
  })
  .then(result => {})
  .catch(err => {});
}