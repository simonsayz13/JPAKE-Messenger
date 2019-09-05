import firebaseDB from './FirebaseDB';

const refUsers = firebaseDB.database().ref('UserProfiles');

export const login = (email, password, success_callback, failed_callback) => {
  firebaseDB.auth().signInWithEmailAndPassword(email, password).then(success_callback, failed_callback);
}

//Function to create an account through firebase
export const signup = (user) => {

  //Prompt name must be longer than 2 characters
  if(user.name.length<3){
    alert("Please enter a name with at least 3 characters")
    return
  }
  //Prompt password must be longer than 5 characters
  if(user.password.length<6)
  {
    alert("Please enter at least 6 characters")
    return
  }
  
  firebaseDB.auth().createUserWithEmailAndPassword(user.email, user.password).then(function() {
    var userf = firebaseDB.auth().currentUser;
    userf.updateProfile({ displayName: user.name})

    let profile = {
      _id: userf.uid,
      name: user.name,
      email: user.email,
      status: 'Offline',
    }
    
    addUserProfile(profile, userf.uid)

  }).catch(function(error) {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
    // [START_EXCLUDE]
    if (errorCode == 'auth/weak-password') {
      alert('The password is too weak.');
      return false
    } else {
      alert(errorMessage);
      return false
      
    }
    console.log(error);
    // [END_EXCLUDE])
  })
  return true
}

export const onLogout = (signoutSuccess) => {
  firebaseDB.auth().signOut().then(function() {
    alert("Successfully signed out!")
    signoutSuccess
  }).catch(function(error) {
    console.log("An error happened when signing out: "+error);
  });
}

export const userName = () => {
  return firebaseDB.auth().currentUser.displayName
}

export const addUserProfile = (user, _id) => {
  refUsers.child(_id).set(user);
}