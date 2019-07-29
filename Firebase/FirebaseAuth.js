import firebaseDB, { serverTimestamp } from './FirebaseDB';

const refUsers = firebaseDB.database().ref('UserProfiles');

export const login = (email, password, success_callback, failed_callback) => {
  const login_status = firebaseDB.auth().signInWithEmailAndPassword(email, password).then(success_callback, failed_callback);
}

export const observeStatus = () => {
	firebaseDB.auth().onAuthStateChanged(this.onAuthStateChanged);
}

//Function to create an account through firebase
export const signup = (user) => {
  if(user.password.length<6)
  {
    alert("Please enter at least 6 characters")
    return
  }

  const profile = {
    name: user.name,
    email: user.email,
    status: 'offline'
  }

  firebaseDB.auth().createUserWithEmailAndPassword(user.email, user.password).then(function() {
    var userf = firebaseDB.auth().currentUser;
    userf.updateProfile({ displayName: user.name})
    addUserProfile(profile)
    alert("Congratulations, your account has been setup")

  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // [START_EXCLUDE]
    if (errorCode == 'auth/weak-password') {
      alert('The password is too weak.');
    } else {
      alert(errorMessage);
      return
    }
    console.log(error);
    // [END_EXCLUDE])
  })
}

export const onAuthStateChanged = (user) => {
  if (!user) {
    try {
      firebaseDB.auth().signInAnonymously();
    } catch ({ message }) {
      console.log("Failed: " + message)
    }
  }
  else {
  	console.log("Reusing auth")
  }
};

export const onLogout = (success) => {
  firebaseDB.auth().signOut().then(function() {
    alert("Successfully signed out!")
    console.log("Sign-out successful.");
    success
  }).catch(function(error) {
    console.log("An error happened when signing out");
  });
}

export const userName = () => {
  return firebaseDB.auth().currentUser.displayName
}

export const addUserProfile = (user) => {
  let key = user.email.substring(0, user.email.indexOf("@"));
  refUsers.child(key).set(user);
}