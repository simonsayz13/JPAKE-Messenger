import React from 'react'
import { StyleSheet, Text, View, YellowBox, Image, KeyboardAvoidingView } from 'react-native'
import { Container, Form, Input, Item, Button} from 'native-base'
import { Icon } from 'react-native-elements'
import * as firebaseAuth from '../Firebase/FirebaseAuth'
import _ from 'lodash';

import logo from '../assets/logo.png'

export default class Login extends React.Component {
  static navigationOptions = {
    header: null,
  };

  constructor(props) {

    //Ignore setting timer warning on android
    YellowBox.ignoreWarnings(['Setting a timer']);
    const _console = _.clone(console);
    console.warn = message => {
      if (message.indexOf('Setting a timer') <= -1) {
        _console.warn(message);
      }
    };


    super(props)

    this.state=({
      email: 'simon13@gmail.com',
      password: '123456',
      avatar: '',
    })
  }

  loginSuccess = () => {
    this.props.navigation.navigate('Home');
  };
  
  loginFailed = () => {
    alert('Login failed. Please tried again.');
  };

  render() {
    return (
      <Container style={styles.container}>
        <KeyboardAvoidingView behavior="padding" enabled>
          <View style={styles.logoContainer}>
            <Image source={logo} style={styles.logo}/>
            <Text style={styles.logoText}>Encrypted Messenger</Text>
          </View>

          <Form>
          <Item>
            <Icon name='person' type='material' color='#00aced'/>
            <Input
              autocorrect={false}
              placeholder='Email'
              //value = 'Simon13@gmail.com'
              round
              onChangeText={(email) => this.setState({email})}/>
          </Item>

          <Item>
            <Icon name='lock' type='material' color='#00aced'/>
            <Input
            placeholder='Password'
            //value = '123456'
            secureTextEntry={true}
            onChangeText={(password) => this.setState({ password })}/>
          </Item>

          <Button style={{marginTop:10}} primary full rounded
          onPress={() => firebaseAuth.login(this.state.email, this.state.password, this.loginSuccess, this.loginFailed)}>
          <Text style={{color: 'white'}}>Login</Text>
          </Button>

          <Button style={{marginTop:10}} success full rounded
          onPress={() => this.props.navigation.navigate("CreateAccount")}>
          <Text style={{color: 'white'}}>Sign Up</Text>
          </Button>
          </Form>
          </KeyboardAvoidingView>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding:50
  },

  mainheader: {
    color: '#00BFFF',
    textAlign: 'center',
    fontSize: 24
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

