import firebaseDB, {serverTimestamp} from './FirebaseDB'

const refUsers = firebaseDB.database().ref('UserProfiles');
const refDirectMessages = firebaseDB.database().ref('DirectMessages');

export const ListenForMessages = (fromUser, toUserEmail, callback) => {
  let fromKey = fromUser.email.substring(0, fromUser.email.indexOf("@"));
  let toKey = toUserEmail.substring(0, toUserEmail.indexOf("@"));

  refDirectMessages.child(fromKey).child(toKey).limitToLast(10).on('child_added', snapshot => callback(parseMessage(snapshot, fromUser.email)));
  refDirectMessages.child(toKey).child(fromKey).limitToLast(10).on('child_added', snapshot => callback(parseMessage(snapshot, fromUser.email)));

  //var update = refUsers+'/'+fromUser.email.substring(0, fromUser.email.indexOf("@"))+'/'+'status'
  // const refUsers = firebaseDB.database().ref('UserProfiles/Simon13/status');
  // refUsers.set('online')
}

export const remove = () => {
  return refDirectMessages.remove()
}

export const setUserStatusOnline = (userName) => {
  const refUsers = firebaseDB.database().ref('UserProfiles/'+userName+'/status');
  refUsers.set('online')
}

export const setUserStatusOffline = (userName) => {
  const refUsers = firebaseDB.database().ref('UserProfiles/'+userName+'/status');
  refUsers.set('offline')
}

const parseMessage = (snapshot, currentUser) => {
  const { createdAt, text, user } = snapshot.val();
  const { key: _id } = snapshot;
  const message = {
    _id,
    createdAt,
    text,
    user,
  };
  // if (currentUser != user.email) {
  //   alert("New Message")
  // }
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

export const sendDirect = messages => {
  for (let i = 0; i < messages.length; i++) {

    const { text, user } = messages[i];

    fromKey = user.email.substring(0, user.email.indexOf("@"));
    toKey = user.toemail.substring(0, user.toemail.indexOf("@"));
    
    const message = {
      _id: user._id,
      text,
      user,
      createdAt: serverTimestamp,
    };
    refDirectMessages.child(fromKey).child(toKey).push(message);
  }
};

export const stopMessageListening = (user) => {
  let fromKey = user.email.substring(0, user.email.indexOf("@"));
  let toKey = user.toemail.substring(0, user.toemail.indexOf("@"));
  refDirectMessages.child(fromKey).child(toKey).off();
  refDirectMessages.child(toKey).child(fromKey).off();
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