import firebase from 'firebase';
import { FirebaseConfig } from './FirebaseConfig'

let instance = null

class FirebaseDB {
  constructor() {
    if (!instance) {
      this.app = firebase.initializeApp(FirebaseConfig);
      instance = this;
    }
    return instance
  }
}

export const serverTimestamp = firebase.database.ServerValue.TIMESTAMP;

const firebaseDB = new FirebaseDB().app;
export default firebaseDB;