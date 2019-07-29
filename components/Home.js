import React from 'react'
import { StyleSheet, Text, View, YellowBox, Image, AsyncStorage } from 'react-native'
import { Container, Form, Label, Button} from 'native-base'
import * as firebaseAuth from '../Firebase/FirebaseAuth'
import * as firebaseHandler from '../Firebase/FirebaseHandler'

import logo from '../assets/logo.png'

export default class Home extends React.Component {
  static navigationOptions = {
    header: null,
  }

  constructor(props) {
    super(props)
    YellowBox.ignoreWarnings(['Setting a timer']);
  }

  signoutSuccess = () => {
    let email = firebaseHandler.userEmail()
    let capitalisedEmail = email.charAt(0).toUpperCase()+email.slice(1)
    let userName = capitalisedEmail.substring(0, capitalisedEmail.indexOf("@"))
    firebaseHandler.setUserStatusOffline(userName)
    this.props.navigation.navigate('Login');
  }

  storeData = async () => {
    try {
      await AsyncStorage.setItem('@MyStore:name', 'simon')
      console.log('done')
    } catch (error) {
      console.log(error)
    }
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

  componentDidMount() {
    //this.storeData()
    let email = firebaseHandler.userEmail()
    let capitalisedEmail = email.charAt(0).toUpperCase()+email.slice(1)
    let userName = capitalisedEmail.substring(0, capitalisedEmail.indexOf("@"))
    firebaseHandler.setUserStatusOnline(userName)
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