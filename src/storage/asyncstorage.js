import AsyncStorage from '@react-native-async-storage/async-storage';

// Saves a user object (must be stringified)
export const saveUser = async (userObject) => {
  try {
    const jsonUser = JSON.stringify(userObject);
    await AsyncStorage.setItem('@user_key', jsonUser);
    console.log("User saved successfully.");
  } catch (e) {
    console.error("Failed to save user", e);
  }
};

// Retrieves and parses the user object
export const getUser = async () => {
  try {
    const jsonUser = await AsyncStorage.getItem('@user_key');
    // If jsonUser is not null, parse and return the object, otherwise return null
    return jsonUser != null ? JSON.parse(jsonUser) : null;
  } catch (e) {
    console.error("Failed to get user", e);
    return null;
  }
};
