import React from 'react';
import { StyleSheet, Text, View, Image, KeyboardAvoidingView} from 'react-native';
import { Container, Form, Input, Item, Label, Button } from 'native-base'
import * as firebaseAuth from '../Firebase/FirebaseAuth';

import logo from '../assets/logo.png'

export default class CreateAccount extends React.Component {
  static navigationOptions = {
    title: 'Sign Up',
  };

  state = {
    name: '',
    email: '',
    password: '',
  };

  onPressCreate = async () => {

    console.log('create account... email:' + this.state.email);

    try {
      const user = {
        name: this.state.name,
        email: this.state.email,
        password: this.state.password,
      };

      await firebaseAuth.signup(user);

    } catch ({ message }) {
      console.log('create account failed. catch error:' + message);
    }
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
              <Label>Name</Label>
              <Input
              autocorrect={false}
              onChangeText={(name) => this.setState({ name })}/>
            </Item>

            <Item>
              <Label>Email</Label>
              <Input
                autocorrect={false}
                onChangeText={(email) => this.setState({email})}/>
            </Item>

            <Item>
              <Label>Password</Label>
              <Input
              secureTextEntry={true}
              onChangeText={(password) => this.setState({ password })}/>
            </Item>

            <Button style={{marginTop:10}} primary full rounded
            onPress={() => this.onPressCreate()}>
            <Text style={{color: 'white'}}>Create Account</Text>
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
    backgroundColor: '#fff',
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
    marginTop: 10,
  }
});
