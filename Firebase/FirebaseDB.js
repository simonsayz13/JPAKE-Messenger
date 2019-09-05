import firebase from 'firebase';
import { firebaseConfig } from './FirebaseConfig'

let instance = null

// Constructor to create firebase database instance
class FirebaseDB {
  constructor() {
    if (!instance) {
      this.app = firebase.initializeApp(firebaseConfig);
      instance = this;
    }
    return instance
  }
}

// return database time stamp object
export const serverTimestamp = firebase.database.ServerValue.TIMESTAMP;

const firebaseDB = new FirebaseDB().app;
export default firebaseDB;