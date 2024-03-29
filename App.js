import Login from './components/Login';
import Chat from './components/Chat';
import CreateAccount from './components/CreateAccount'
import Contacts from './components/Contacts'
import Home from './components/Home'
import EncryptionSplash from './components/EncryptionSplash'
import { createStackNavigator, createAppContainer } from 'react-navigation'

// Create the navigator

const AppStackNavigator = createStackNavigator(
  {
  Login: {screen:Login},
  CreateAccount: {screen:CreateAccount},
  Chat: {screen:Chat},
  Contacts: {screen:Contacts},
  Home: {screen:Home},
  EncryptionSplash: {screen:EncryptionSplash},
  },
  {
    headerMode: 'screen',
    navigationOptions: {
      headerVisible: true,
    }
  }
);

export default createAppContainer(AppStackNavigator);