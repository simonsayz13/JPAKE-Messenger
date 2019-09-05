import firebaseDB, {serverTimestamp} from './FirebaseDB'
import * as asyncstore from '../AsyncStorage/Store'
import CryptoJS from "crypto-js";

const refUsers = firebaseDB.database().ref('UserProfiles');
const refDirectMessages = firebaseDB.database().ref('DirectMessages');

//Listen to messages in the given location on firebase database
export const ListenForMessages = (fromKey, toKey, callback) => {
  refDirectMessages.child(fromKey).child(toKey).limitToLast(1).on('child_added', snapshot => callback(parseMessage(snapshot)));
}

//Set user's status to 'online' on database
export const setUserStatusOnline = (userID) => {
  const refUsers = firebaseDB.database().ref('UserProfiles/'+userID+'/status');
  refUsers.set('Online')
  return refUsers
}
//Set user's status to 'offline' on database
export const setUserStatusOffline = (userID) => {
  const refUsers = firebaseDB.database().ref('UserProfiles/'+userID+'/status');
  refUsers.set('Offline')
}

//readData locally and compare messages with firebase database, retrieve new items if required
export const readData = (userStore, fromKey, toKey, sessionKey, callback) => {
  asyncstore.retrieveItem(userStore).then(messageArray => { 
    refDirectMessages.child(fromKey).child(toKey).limitToLast(1).once('value', lastMessage => {
      var lastfbMessageCreationTime = 0
      lastMessage.forEach(theMessage=>{lastfbMessageCreationTime = parseMessage(theMessage).createdAt})
      //If firebase has items store but local storage doesn't
      if (messageArray == null && lastMessage.toJSON() != null) {
        refDirectMessages.child(fromKey).child(toKey).once('value', fetchedMessages => {
          var newMessageArray = new Array()
          fetchedMessages.forEach(message => {
            const theNewMessage = parseMessage(message)
            const decrypted = CryptoJS.AES.decrypt(theNewMessage.text.toString(), sessionKey.toString())
            const plainText = decrypted.toString(CryptoJS.enc.Utf8)

            const newMessageDecrypted = {
              _id: theNewMessage._id,
              createdAt: theNewMessage.createdAt,
              text: plainText,
              user: theNewMessage.user,
            }
            newMessageArray.push(newMessageDecrypted)
          })
          asyncstore.storeItem(userStore, newMessageArray)
          callback(newMessageArray)
        })
      }
      else if (messageArray == null && lastMessage.toJSON() == null) {
        return callback([])
      }
      //If local message does not match the retrieved item, then download latest files
      else if (messageArray[messageArray.length-1].createdAt != lastfbMessageCreationTime) {
        console.log('fetching newest Item')
        refDirectMessages.child(fromKey).child(toKey).orderByChild('createdAt').startAt(messageArray[messageArray.length-1].createdAt ).once('value').then(newMessages => {
          newMessages.forEach(message => {
            if (parseMessage(message).createdAt != messageArray[messageArray.length-1].createdAt){
              const theNewMessage = parseMessage(message)
              const decrypted = CryptoJS.AES.decrypt(theNewMessage.text.toString(), sessionKey.toString())
              const plainText = decrypted.toString(CryptoJS.enc.Utf8)

              const newMessageDecrypted = {
                _id: theNewMessage._id,
                createdAt: theNewMessage.createdAt,
                text: plainText,
                user: theNewMessage.user,
              }
              messageArray.push(newMessageDecrypted)
            }
          })
          asyncstore.storeItem(userStore, messageArray)
          callback(messageArray)
        })
      } 
      else{
        return callback(messageArray)
      }
    })
  })
}

//Parse message snapshot into javascript object
const parseMessage = (snapshot) => {
  const { createdAt, text, user } = snapshot.val();
  const { key: _id } = snapshot;
  const message = {
    _id,
    createdAt,
    text,
    user,
  };
  return message;
};

//Get the list of users.
export const getUsers = (callback) => {
  refUsers.once('value', snapshot => callback(parseUsers(snapshot)));
}

//Listen for any updates in user's online status
export const listenToUserStatus = (callback) => {
  refUsers.on('child_changed', snapshot => callback(updateUserStatus(snapshot)))
}

//Stop updating user status
export const stopListeningToUserStatus = () => {
  refUsers.off()
}

//Create a connection with a user by pushing an initial message to the user's database location
export const setConnection = (ref, message) => {
  firebaseDB.database().ref(ref).set(message)
  return firebaseDB.database().ref(ref)
}

//Send a request to the database
export const pushRequestConnection = (ref, value) => {
  firebaseDB.database().ref(ref).push( {request : value})
}

//Send payload to database
export const pushPayloadConnection = (ref, payload) => {
  firebaseDB.database().ref(ref).push({payload: payload})
}

//Retrieve all users as an array of javascript objects
const parseUsers = snapshot => {
  var users = new Array();
  snapshot.forEach(function(childSnapshot) {
    const {name, email, status, _id} = childSnapshot.val()

    const user = {
      key: _id,
      name,
      email,
      status,
      _id
    }

    users.push(user)
  })
  return users;
};
//Retrieve new user status and return the snapshot as a javascript object
const updateUserStatus = snapshot => {
  const { name, email, status, _id } = snapshot.val();
  const user = {
    key: _id,
    name,
    email,
    status,
    _id
  }
  return user
}

//Push the message to firebase database and store the message locally
export var sendDirect = async(messages) => {
  const { toUserID, userStore, text, user, sessionKey} = messages[0]
  var cipherText = CryptoJS.AES.encrypt(text, sessionKey.toString()).toString()

  const uploadMessage ={
    text: cipherText,
    user,
    createdAt: serverTimestamp,
  }

  try {
    await refDirectMessages.child(user._id).child(toUserID).push(uploadMessage);
    await refDirectMessages.child(toUserID).child(user._id).push(uploadMessage);
  } catch (error) {
    console.log(error.message);
  }

  saveNewMessage(userStore, user._id, toUserID, sessionKey)
};

//Store the message to local store accordingly
export const saveNewMessage =(userStore, fromKey, toKey, sessionKey) => {
  asyncstore.retrieveItem(userStore).then(messageArray => {
    refDirectMessages.child(fromKey).child(toKey).limitToLast(1).once('value').then(newMessage =>{

      var theNewMessage
      newMessage.forEach(nMessage => {
        theNewMessage = parseMessage(nMessage)
      })

      var decrypted = CryptoJS.AES.decrypt(theNewMessage.text.toString(), sessionKey.toString())
      var plainText = decrypted.toString(CryptoJS.enc.Utf8)

      const newMessageDecrypted = {
        _id: theNewMessage._id,
        createdAt: theNewMessage.createdAt,
        text: plainText,
        user: theNewMessage.user,
      }

      if (messageArray == null) {
        asyncstore.storeItem(userStore, [newMessageDecrypted])
      } else {
        messageArray.push(newMessageDecrypted)
        asyncstore.storeItem(userStore, messageArray)
      }
    })
  })
}

//Stop listening to direct message of this user.
export const stopMessageListening = (fromKey, toKey) => {
  refDirectMessages.child(fromKey).child(toKey).off();
}

//Retrieve current user's user id from firebase server
export const uid = () => {
  return firebaseDB.auth().currentUser.uid;
}

//Retrieve current user's display name from firebase server
export const userName = () => {
  return firebaseDB.auth().currentUser.displayName
}

//Retrieve current user's email from firebase server
export const userEmail = () => {
  return firebaseDB.auth().currentUser.email
}