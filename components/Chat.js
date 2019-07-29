import React from 'react';
import { YellowBox } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import * as firebasehandler from '../Firebase/FirebaseHandler';

export default class Chat extends React.Component {

  static navigationOptions = {
    title: 'Chat',
  };

	constructor(props) {
    super(props);
    YellowBox.ignoreWarnings(['Setting a timer'])
  }

  state = {
    messages: [],
  }

	static navigationOptions = ({ navigation }) => ({
 	 	title: navigation.getParam('user').toname,
  });
  
  get user() {
    return {
      _id: firebasehandler.uid(),
      name: this.props.navigation.state.params.user.name,
      email: this.props.navigation.state.params.user.email,
      avatar: this.props.navigation.state.params.user.avatar,
      toemail: this.props.navigation.state.params.toEmail,
    };
  }

	render() {
	  return (
	    <GiftedChat
        user={this.user}
        messages={this.state.messages}
        onSend={firebasehandler.sendDirect}
        alwaysShowSend={true}
        showUserAvatar={false}
		  />
	  );
	}

  //Load all messages from firebase database
	componentDidMount() {
    const { navigation } = this.props;
    fromUser = navigation.getParam('user')
    toEmail = navigation.getParam('toEmail')
    firebasehandler.ListenForMessages(fromUser, toEmail, message =>
      this.setState(previousState => ({
        messages: GiftedChat.append(previousState.messages, message),
      }))
    );
  }

  componentWillUnmount() {
    firebasehandler.stopMessageListening(this.user)
  }
}
