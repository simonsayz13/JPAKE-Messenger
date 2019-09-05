import {AsyncStorage} from 'react-native';

// Function that convert the item in parameter into a json string then stored in async storage
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

// Function to retrieve the item based on the key in parameter, using json parse to parse the item from json
// string to javascript object
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

// Function to delete item in key. Used for resetting local data
export var deleteItem = async(key) => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (error) {
        // Error retrieving data
        console.log(error.message);
    }
}