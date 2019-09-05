import React from 'react';
import { View, FlatList, YellowBox, Alert} from 'react-native';
import {HeaderBackButton} from 'react-navigation'
import { ListItem, SearchBar } from "react-native-elements"
import * as firebaseHandler from '../Firebase/FirebaseHandler'
import * as asyncstore from '../AsyncStorage/Store'


export default class Contacts extends React.Component {

	constructor(props) {
    YellowBox.ignoreWarnings(['Setting a timer']);
    super(props)
    this.state = {
      dataSource: [],
      fullData: [],
    }
  }

  static navigationOptions = ({ navigation }) => ({
    title: 'Users',
    headerLeft: (
      <HeaderBackButton
        title="Contacts"
        onPress={() => navigation.navigate('Home')}
      />
    ),
  });

  get user() {
  	return {
      _id: firebaseHandler.uid(),
  		name: firebaseHandler.userName(),
      email: firebaseHandler.userEmail(),
      avatar: '',
  	}
  }

  onPressItem = async (item) => {
    asyncstore.retrieveItem('@Key:'+this.user._id+':'+item._id).then(key=>{
      if (key != null){
        this.props.navigation.navigate('Chat',{
          user: this.user,
          toUserName: item.name,
          toUserID: item._id,
          sessionKey: key.toString()
        })
      }
      else if (key == null && item.status == 'Online') {
        firebaseHandler.setConnection('OnlineUsers/'+item._id+'/Connection/', {_id: this.user._id, name: this.user.name, email: this.user.email, activity:[]})
        this.props.navigation.navigate('EncryptionSplash',{
          connectionURL: 'OnlineUsers/'+item._id+'/Connection',
          status: 0,
          user: this.user,
          toUserID: item._id,
          toUserName: item.name,
        })
      }
      else if (key == null && item.status == 'Offline') {
        Alert.alert('Encrypted Session Required!', item.name+' must be online to establish initial authentication')
      }
    })
  }

  searchFilter = text => {
    if (text == '') {
      this.setState({dataSource: this.state.fullData, search: ''})
    }
    else {
      const newData = this.state.fullData.filter(item => {
        const itemData = `${item.name.toLowerCase()}`
        const textData = text.toLowerCase()
        return itemData.indexOf(textData) > -1;
      });
      this.setState({dataSource: newData, search: text});
    }
  };

  createUserList = userslist => {
    var filteredUserList = []
 
    // filter out its own user - don't display its own email
    var sortusers = userslist.filter((item)=>item.email!=this.user.email)

    // Sort list
    sortusers.sort((a,b) => a.name.localeCompare(b.name))

    for (var i=0; i<sortusers.length; i++) {
      if (sortusers[i].email.toLowerCase() != firebaseHandler.userEmail()) {filteredUserList.push(sortusers[i])}
    } 

    this.setState({dataSource: filteredUserList })
    this.setState({fullData: filteredUserList })
  }

  updateUserStatus = user => {
    for(var i = 0; i<this.state.fullData.length; i++){
      if (user.email == this.state.fullData[i].email) {
        this.state.fullData[i].status = user.status
      }
    }
    this.setState({dataSource: this.state.fullData})
  }

  //Render search bar
  renderHeader = () => {  
    const { search } = this.state;  
    return (
      <SearchBar
        lightTheme
        round
        placeholder="Search"
        onChangeText={text => this.searchFilter(text)}
        autoCorrect={false}
        value={search}
      />
    )
  }


  renderSeparator = () => {
    return (
      <View
        style={{
          height: 1,
          backgroundColor: "#CED0CE",
        }}
      />
    );
  };

 

	render() {
    return (
      <View>
        <FlatList
          extraData={this.state}
          data={this.state.dataSource}
          renderItem={({item}) => 
            <ListItem
              roundAvatar
              title={item.name}
              subtitle={item.email}
              onPress={() => this.onPressItem(item)}
              badge={{ value: item.status, containerStyle: { backgroundColor: 'black' } ,textStyle: { color: 'white' }}}
              titleStyle={{ color: 'black', fontWeight: 'bold' }}
              subtitleStyle={{ color: 'black' }}
              chevron
            />
          }
          ListHeaderComponent={this.renderHeader}
          ListFooterComponent={this.renderSeparator}
          ItemSeparatorComponent={this.renderSeparator}
        />
    </View>
    )
  }

  componentDidMount() {
    firebaseHandler.getUsers(users => {this.createUserList(users)})
    firebaseHandler.listenToUserStatus(updatedUsers => {this.updateUserStatus(updatedUsers)})
  }

  componentWillUnmount() {
    firebaseHandler.stopListeningToUserStatus()
 	}
}