import React from 'react'
import { StyleSheet, Text, View, YellowBox, Image, Alert } from 'react-native'
import { Container, Form, Label, Button} from 'native-base'
import * as firebaseAuth from '../Firebase/FirebaseAuth'
import * as firebaseHandler from '../Firebase/FirebaseHandler'
import firebaseDB from '../Firebase/FirebaseDB'
import logo from '../assets/logo.png'

export default class Home extends React.Component {
  static navigationOptions = {
    header: null,
  }

  constructor(props) {
    super(props)
    YellowBox.ignoreWarnings(['Setting a timer']);
    this.updateFirebase = this.updateFirebase.bind(this)
    this.state = {
      alertPresent: false
    }
  }

  get user() {
  	return {
      _id: firebaseHandler.uid(),
  		name: firebaseHandler.userName(),
      email: firebaseHandler.userEmail(),
      avatar: '',
  	}
  }

  signoutSuccess = () => {
    let userID = firebaseHandler.uid()
    firebaseHandler.setUserStatusOffline(userID)
    
    this.props.navigation.navigate('Login');

    var onlineUsersRef = firebaseDB.database().ref('OnlineUsers/'+userID+'/')
    onlineUsersRef.remove()
  }

  render() {
    return (
      <Container style={styles.container}>

        <View style={styles.logoContainer}>
          <Image source={logo} style={styles.logo}/>
          <Text style={styles.logoText}>Encrypted Messenger</Text>
        </View>

        <Form>

        <View style={styles.viewContainer}>
          <Label>Welcome {firebaseAuth.userName()}</Label>
        </View>

        <Button style={{marginTop:10}} primary full rounded
        onPress={() => this.props.navigation.navigate("Contacts")}>
          <Text style={{color: 'white'}}>Start</Text>
        </Button>

        <Button style={{marginTop:10}} success full rounded
        onPress={() => firebaseAuth.onLogout(this.signoutSuccess())}>
          <Text style={{color: 'white'}}>Sign out</Text>
        </Button>
        </Form>
      </Container>
    );
  }

  updateFirebase() {
    let userID = firebaseHandler.uid()
    var con = firebaseHandler.setUserStatusOnline(userID)
    var connectedRef = firebaseDB.database().ref('.info/connected');
    var onlineUsersRef = firebaseDB.database().ref('OnlineUsers/'+userID+'/')

    connectedRef.on('value', function(snap) {
      if (snap.val() === true) {
        con.onDisconnect().set('Offline')
        onlineUsersRef.onDisconnect().remove()
        onlineUsersRef.remove()
      }
    });

    const { navigate } = this.props.navigation
    onlineUsersRef.limitToLast(1).on('child_added', function (snap) {
      const {name, _id} = snap.val()
      Alert.alert(
        'Incoming Connection',
        name +' wants a secure chat.',
        [
          {
            text: 'Decline',
            onPress: () => {
              firebaseHandler.pushRequestConnection('OnlineUsers/'+userID+'/Connection/', false)
              firebaseDB.database().ref('OnlineUsers/'+userID+'/Connection/').remove()
            },
            style: 'cancel',
          },
          {text: 'Accept', onPress: () => {
            firebaseHandler.pushRequestConnection('OnlineUsers/'+userID+'/Connection/', true)
            navigate('EncryptionSplash', {
              connectionURL: 'OnlineUsers/'+userID+'/Connection/',
              status: 1,
              user: this.user,
              toUserID: _id,
              toUserName: name
            })
          }},
        ],
        {cancelable: false},
      );
    }.bind(this));
  }

  componentDidMount() {
    this.updateFirebase()
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding:50
  },

  mainheader: {
    color: '#00BFFF',
    textAlign: 'center',
    fontSize: 24
  },

  viewContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },

  logoContainer: {
    alignItems: 'center'
  },

  logo: {
    width: 120,
    height: 120
  },

  logoText: {
    color: 'black',
    fontSize: 20,
    fontWeight: '500',
    marginTop: 0,
  }
});