import React from 'react';
import { YellowBox} from 'react-native';
import {HeaderBackButton} from 'react-navigation'
import { GiftedChat } from 'react-native-gifted-chat';
import * as firebasehandler from '../Firebase/FirebaseHandler';
import * as asyncstore from '../AsyncStorage/Store';
import CryptoJS from "crypto-js";

export default class Chat extends React.Component {

	constructor(props) {
    super(props);
    YellowBox.ignoreWarnings(['Setting a timer','Encountered two children'])
    console.disableYellowBox = true;
    console.log()
  }

  state = {
    messages: Array(),
    data: String,
    messageCount: Number,
  }

	static navigationOptions = ({ navigation }) => ({
      title: navigation.state.params.toUserName,
      headerLeft: (
        <HeaderBackButton
          title="Contacts"
          onPress={() => navigation.navigate('Contacts')}
        />
      ),
  });

  // Get function to retrieve current information
  get user() {
    return {
      _id: this.props.navigation.state.params.user._id,
      name: this.props.navigation.state.params.user.name,
      email: this.props.navigation.state.params.user.email,
      avatar: this.props.navigation.state.params.user.avatar,
    };
  }
  
  // Render the GiftedChat UI and display messages from the state array "messages"
	render() {
	  return (
	    <GiftedChat
        user={this.user}
        messages={this.state.messages}
        user_id={this.user._id}
        toUserID = {this.props.navigation.state.params.toUserID}
        userStore={this.user._id+':'+this.props.navigation.state.params.toUserID}
        sessionKey={this.props.navigation.state.params.sessionKey}
        onSend={firebasehandler.sendDirect}
        alwaysShowSend={true}
        showUserAvatar={false}
		  />
	  );
  }
  
  // Call function to synchronise local storage against firebase database and display new messages if requried
  readLocalData() {
    const fromKey = this.user._id
    const toKey = this.props.navigation.state.params.toUserID
    const userStore = this.user._id+':'+this.props.navigation.state.params.toUserID
    const key = this.props.navigation.state.params.sessionKey

    firebasehandler.readData(userStore, fromKey, toKey, key ,function(message) {      
      this.setState(previousState => ({
        messages: GiftedChat.append([], message.reverse()),
      }))
    }.bind(this))
  }

  //Listen to database retrieve, store and display new message, 
  listenToDatabase () {
    const userStore = this.user._id+':'+this.props.navigation.state.params.toUserID
    const fromKey = this.user._id
    const toKey = this.props.navigation.state.params.toUserID
    const sessionKey = this.props.navigation.state.params.sessionKey
    firebasehandler.ListenForMessages(fromKey, toKey, function(message) {
      asyncstore.retrieveItem(userStore).then(messageArray => {
        if (messageArray == null || (message.createdAt != messageArray[messageArray.length-1].createdAt)) {
          var decrypted = CryptoJS.AES.decrypt(message.text.toString(), sessionKey)
          var plainText = decrypted.toString(CryptoJS.enc.Utf8)
          const newMessage = {
            _id: message._id,
            createdAt: message.createdAt,
            text: plainText,
            user: message.user,
          }
          this.setState(previousState => ({
            messages: GiftedChat.append(previousState.messages, newMessage),
          }))
          if (message.user._id != fromKey ) {
            firebasehandler.saveNewMessage(userStore, fromKey, toKey, sessionKey)
          }
        }
      })
    }.bind(this));
  }

  async fetchData() {
    await this.readLocalData()
    await this.listenToDatabase()
  }

	componentDidMount() {
    //const userStore = this.props.navigation.state.params.user._id+':'+this.props.navigation.state.params.toUserID
    //asyncstore.deleteItem(userStore)
    //asyncstore.deleteItem('@Key:'+this.props.navigation.state.params.user._id+':'+this.props.navigation.state.params.toUserID)
    this.fetchData()
  }
  // Before leaving this screen, stop listening to database
  componentWillUnmount() {
    fromKey = this.props.navigation.state.params.user._id
    toKey = this.props.navigation.state.params.toUserID
    firebasehandler.stopMessageListening(fromKey, toKey)
  }
}
