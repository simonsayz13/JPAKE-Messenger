import React from 'react';
import { View, FlatList, YellowBox, AsyncStorage } from 'react-native';
import { ListItem, SearchBar, Badge } from "react-native-elements"
import * as firebaseHandler from '../Firebase/FirebaseHandler'

export default class Contacts extends React.Component {

	constructor(props) {
    YellowBox.ignoreWarnings(['Setting a timer']);
    super(props)
    this.state = {
      dataSource: [],
      fullData: [],
    }
  }

  static navigationOptions = {
    title: 'Contact List',
  }

  get user() {
  	return {
  		name: firebaseHandler.userName(),
      email: firebaseHandler.userEmail(),
      avatar: '',
  	}
  }

  onPressItem = (item) => {

    const fromUser = {...this.user, toname:item.name, toemail: item.email.toLowerCase()}
      this.props.navigation.navigate('Chat', {
        user: fromUser,
        toEmail: item.email.toLowerCase(),
    })


    // if (item.status == 'online') {
    //   const fromUser = {...this.user, toname:item.name, toemail: item.email.toLowerCase()}
    //   this.props.navigation.navigate('Chat', {
    //     user: fromUser,
    //     toEmail: item.email.toLowerCase(),
    //   })
    // }
    // else {
    //   alert(item.name+' is offline!')
    // }
  }

  searchFilterFunction = text => {
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


  
  retireveData = async () => {
    try {
      const name = await AsyncStorage.getItem('@MyStore:key')
      console.log(name)
    } catch (error){
      console.log(error)
    }
  }

  deleteUserId = async () => {
    try {
      await AsyncStorage.removeItem('@MyStore:name');
      await AsyncStorage.removeItem('@MyStore:key');
    } catch (error) {
      // Error retrieving data
      console.log(error.message);
    }
  }

  //Render search bar
  renderHeader = () => {  
    const { search } = this.state;  
    return (
      <SearchBar
        lightTheme
        round
        placeholder="Search"
        onChangeText={text => this.searchFilterFunction(text)}
        autoCorrect={false}
        value={search}
      />
    )
  }


  renderSeparator = () => {
    return (
      <View
        style={{
          //height: 1,
          //backgroundColor: '#CED0CE',
          //paddingVertical: 20,
          //borderTopWidth: 1,
          //borderColor: "#CED0CE",

          height: 1,
          backgroundColor: "#CED0CE",
        }}
      />
    );
  };

	render() {
    return (
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
    )
  }

  componentDidMount() {
    firebaseHandler.getUsers(users => {this.createUserList(users)})
    firebaseHandler.listenToUserStatus(updatedUsers => {this.updateUserStatus(updatedUsers)})

    //this.retireveData()
    //this.deleteUserId()
    //firebaseHandler.remove()
  }

  componentWillUnmount() {
    firebaseHandler.stopListeningToUserStatus()
 	}
}