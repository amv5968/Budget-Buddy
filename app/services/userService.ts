// import db from './database';
// import { Platform } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// export interface User {
//   id: number;
//   username: string;
//   email: string;
// }

// let webUserId = 1;

// export const createUser = async (username: string, email: string, password: string): Promise<boolean> => {
//   try {
//     if (Platform.OS === 'web') {
//       const existingUsers = await AsyncStorage.getItem('users');
//       const users = existingUsers ? JSON.parse(existingUsers) : [];
      
//       if (users.find((u: any) => u.username === username || u.email === email)) {
//         return false;
//       }
      
//       users.push({ id: webUserId++, username, email, password });
//       await AsyncStorage.setItem('users', JSON.stringify(users));
//       return true;
//     }

//     if (!db) {
//       throw new Error('Database not initialized');
//     }

//     const result = (db as any).runSync(
//       'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
//       [username, email, password]
//     );
//     return result.changes > 0;
//   } catch (error) {
//     console.error('Error creating user:', error);
//     return false;
//   }
// };

// export const loginUser = async (emailOrUsername: string, password: string): Promise<User | null> => {
//   try {
//     if (Platform.OS === 'web') {
//       const existingUsers = await AsyncStorage.getItem('users');
//       const users = existingUsers ? JSON.parse(existingUsers) : [];
      
//       const user = users.find(
//         (u: any) => (u.email === emailOrUsername || u.username === emailOrUsername) && u.password === password
//       );
      
//       if (user) {
//         return { id: user.id, username: user.username, email: user.email };
//       }
//       return null;
//     }

//     if (!db) {
//       throw new Error('Database not initialized');
//     }

//     const result = (db as any).getFirstSync(
//       'SELECT id, username, email FROM users WHERE (email = ? OR username = ?) AND password = ?',
//       [emailOrUsername, emailOrUsername, password]
//     ) as User | null;
    
//     return result || null;
//   } catch (error) {
//     console.error('Error logging in:', error);
//     return null;
//   }
// };