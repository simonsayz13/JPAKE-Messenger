import firebaseDB, {serverTimestamp} from './FirebaseDB'
import * as asyncstore from '../AsyncStorage/Store'

const refUsers = firebaseDB.database().ref('UserProfiles');
const refDirectMessages = firebaseDB.database().ref('DirectMessages');

export const ListenForMessages = (fromEmail, toEmail, callback) => {
  let fromKey = fromEmail.substring(0, fromEmail.indexOf("@"));
  let toKey = toEmail.substring(0, toEmail.indexOf("@"));
  refDirectMessages.child(fromKey).child(toKey).limitToLast(1).on('child_added', snapshot => callback(parseMessage(snapshot)));
}

export const remove = () => {
  return refDirectMessages.remove()
}

export const setUserStatusOnline = (userName) => {
  const refUsers = firebaseDB.database().ref('UserProfiles/'+userName+'/status');
  refUsers.set('Online')
}

export const setUserStatusOffline = (userName) => {
  const refUsers = firebaseDB.database().ref('UserProfiles/'+userName+'/status');
  refUsers.set('Offline')
}

export const readData = (fromUser, fromEmail, toEmail, callback) => {
  let fromKey = fromEmail.substring(0, fromEmail.indexOf("@"));
  let toKey = toEmail.substring(0, toEmail.indexOf("@"));

  asyncstore.retrieveItem(fromUser).then(messageArray => {
    
    refDirectMessages.child(fromKey).child(toKey).limitToLast(1).once('value', lastMessage => {
      var lastfbMessageCreationTime = 0
      lastMessage.forEach(theMessage=>{lastfbMessageCreationTime = parseMessage(theMessage).createdAt})

      //If firebase has items store but local storage doesn't
      if (messageArray == null && lastMessage.toJSON() != null) {
        //console.log('fetch all items')
        refDirectMessages.child(fromKey).child(toKey).once('value', fetchedMessages => {
          var newMessageArray = new Array()
          fetchedMessages.forEach(message => {
            newMessageArray.push(parseMessage(message))
          })
          asyncstore.storeItem(fromUser, newMessageArray)
          callback(newMessageArray)
        })
      }
      else if (messageArray == null && lastMessage.toJSON() == null) {
        //console.log("nothing")
        return callback([])
      }
      //If local message does not match the retrieved item, then download latest files
      else if (messageArray[messageArray.length-1].createdAt != lastfbMessageCreationTime) {
        console.log('fetching newest Item')
        refDirectMessages.child(fromKey).child(toKey).orderByChild('createdAt').startAt(messageArray[messageArray.length-1].createdAt ).once('value').then(newMessages => {
          newMessages.forEach(message => {
            if (parseMessage(message).createdAt != messageArray[messageArray.length-1].createdAt){
              messageArray.push(parseMessage(message))
            }
          })
          asyncstore.storeItem(fromUser, messageArray)
          callback(messageArray)
        })
      } 
      else{
        //console.log('happy days')
        return callback(messageArray)
      }
    })
  })
}


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

export const getUsers = (callback) => {
  refUsers.once('value', snapshot => callback(parseUsers(snapshot)));
}

export const listenToUserStatus = (callback) => {
  refUsers.on('child_changed', snapshot => callback(updateUserStatus(snapshot)))
}

export const stopListeningToUserStatus = () => {
  refUsers.off()
}

const parseUsers = snapshot => {
  var users = new Array();
  snapshot.forEach(function(childSnapshot) {
    const {name, email, status } = childSnapshot.val()

    const user = {
      key: email,
      name,
      email,
      status,
    }

    users.push(user)
  })
  return users;
};

const updateUserStatus = snapshot => {
  const { name, email, status } = snapshot.val();
  const user = {
    key: email,
    name,
    email,
    status,
  }
  return user
}

export var sendDirect = async(messages) => {

  for (let i = 0; i < messages.length; i++) {

    const { fromUser, text, user, toEmail } = messages[i]

    fromKey = user.email.substring(0, user.email.indexOf("@"));
    toKey = toEmail.substring(0, toEmail.indexOf("@"));
    
    const message = {
      text,
      user,
      createdAt: serverTimestamp,
    };

    try {
      await refDirectMessages.child(fromKey).child(toKey).push(message);
      await refDirectMessages.child(toKey).child(fromKey).push(message);
    } catch (error) {
      console.log(error.message);
    }

    saveNewMessage(fromUser, fromKey, toKey, message)
  }
};

export const saveNewMessage =(fromUser, fromKey, toKey) => {
  asyncstore.retrieveItem(fromUser).then(messageArray => {
    refDirectMessages.child(fromKey).child(toKey).limitToLast(1).once('value').then(newMessage =>{
      if (messageArray == null) {
        //console.log('create new store')
        newMessageArray = new Array()
        newMessage.forEach(message => {
          newMessageArray.push(parseMessage(message))
        })
        asyncstore.storeItem(fromUser, newMessageArray)
      } else {
        //console.log('store new message')
        newMessage.forEach(nMessage => {
          messageArray.push(parseMessage(nMessage))
        })
        asyncstore.storeItem(fromUser, messageArray)
      }
    })
  })
}



export const stopMessageListening = (fromEmail) => {
  let fromKey = fromEmail.substring(0, fromEmail.indexOf("@"));
  let toKey = toEmail.substring(0, toEmail.indexOf("@"));
  refDirectMessages.child(fromKey).child(toKey).off();
}

export const uid = () => {
  return firebaseDB.auth().currentUser.uid;
}

export const userName = () => {
  return firebaseDB.auth().currentUser.displayName
}

export const userEmail = () => {
  return firebaseDB.auth().currentUser.email
}

function newFunction() {
  console.log('stop');
}
