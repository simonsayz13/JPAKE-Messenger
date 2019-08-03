import {AsyncStorage} from 'react-native';

export const storeItem = async(key, item) =>{
    try {
        //we want to wait for the Promise returned by AsyncStorage.setItem()
        //to be resolved to the actual value before returning the value
        var jsonItem = await AsyncStorage.setItem(key, JSON.stringify(item));
        return jsonItem;
    } catch (error) {
        console.log(error.message);
    }
}

export var retrieveItem = async(key) => {
    try {
        var retrievedItem =  await AsyncStorage.getItem(key);
        var item = JSON.parse(retrievedItem);
        return item;
    } catch (error) {
        console.log(error.message);
    }
    return 
}

export var deleteItem = async(key) => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        // Error retrieving data
        console.log(error.message);
    }
}