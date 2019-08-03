import React from 'react';
import { YellowBox, AsyncStorage } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import * as firebasehandler from '../Firebase/FirebaseHandler';
import * as asyncstore from '../AsyncStorage/Store';

export default class Chat extends React.Component {

  static navigationOptions = {
    title: 'Chat',
  }

	constructor(props) {
    super(props);
    YellowBox.ignoreWarnings(['Setting a timer','Encountered two children'])
    console.disableYellowBox = true;
  }

  state = {
    messages: Array(),
    data: String,
    messageCount: Number,
  }

	static navigationOptions = ({ navigation }) => ({
 	 	title: navigation.state.params.toName,
  });
  
  get user() {
    return {
      _id: this.props.navigation.state.params.user._id,
      name: this.props.navigation.state.params.user.name,
      email: this.props.navigation.state.params.user.email,
      avatar: this.props.navigation.state.params.user.avatar,
    };
  }
	render() {
	  return (
	    <GiftedChat
        user={this.user}
        messages={this.state.messages}
        toEmail={this.props.navigation.state.params.toEmail}
        user_id={this.user._id}
        fromKey={this.props.navigation.state.params.user.name+':'+this.props.navigation.state.params.toName}
        toKey={this.props.navigation.state.params.toName+':'+this.props.navigation.state.params.user.name}
        onSend={firebasehandler.sendDirect}
        alwaysShowSend={true}
        showUserAvatar={false}
		  />
	  );
  }
  
  readLocalData() {
    const fromUser = this.props.navigation.state.params.user.name+':'+this.props.navigation.state.params.toName
    const fromEmail = this.props.navigation.state.params.user.email
    const toEmail = this.props.navigation.state.params.toEmail

    firebasehandler.readData(fromUser, fromEmail, toEmail, function(message) {
      this.setState(previousState => ({
        messages: GiftedChat.append([], message.reverse()),
      }))
    }.bind(this))
    
  }
  //Listen To Database download new data, 
  listenToDatabase () {
    const fromUser = this.props.navigation.state.params.user.name+':'+this.props.navigation.state.params.toName
    const fromEmail = this.props.navigation.state.params.user.email
    const toEmail = this.props.navigation.state.params.toEmail

    firebasehandler.ListenForMessages(fromEmail, toEmail, function(message) {
      asyncstore.retrieveItem(fromUser).then(messageArray => {

        if (messageArray == null || (message.createdAt != messageArray[messageArray.length-1].createdAt)) {

          this.setState(previousState => ({
            messages: GiftedChat.append(previousState.messages, message),
          }))
          if (message.user.email != fromEmail ) {
            const fromKey = fromEmail.substring(0, fromEmail.indexOf("@"));
            const toKey = toEmail.substring(0, toEmail.indexOf("@"));
            firebasehandler.saveNewMessage(fromUser, fromKey, toKey)
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
    //const fromUser = this.props.navigation.state.params.user.name+':'+this.props.navigation.state.params.toName
    //asyncstore.deleteItem(fromUser)

    this.fetchData()
  }
  componentWillUnmount() {
    fromEmail = this.props.navigation.state.params.user.email
    toEmail = this.props.navigation.state.params.toEmail
    firebasehandler.stopMessageListening(fromEmail, toEmail)
  }
}
