// import React, { createContext, useContext, useState, useEffect } from 'react';
// import {User} from '../services/userService';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// interface AuthContextType {
//   user: User | null;
//   login: (user: User) => Promise<void>;
//   logout: () => Promise<void>;
//   isLoading: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider = ({children}: {children: React.ReactNode}) => {
  
//   const [user, setUser] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
  
//   useEffect(() => {
//     loadUser();
//   }, []);
  
//   const loadUser = async () => {
//     try {
//       const userData = await AsyncStorage.getItem('user');
//       if(userData) {
      
//         setUser(JSON.parse(userData));
      
//       }
//     } catch (error) {
    
//       console.error('Error loading user: ', error);
    
//     } finally {
    
//       setIsLoading(false);
    
//     }
//   };
//   const login = async (user: User) => {
  
//     try {
//       await AsyncStorage.setItem('user', JSON.stringify(user));
//       setUser(user);
//     } catch (error) {
    
//       console.error('Error saving user: ', error);
    
//     }
//   };
  
//   const logout = async () => {
    
//     try {
//       await AsyncStorage.removeItem('user');
//       setUser(null);
//     } catch (error) {
    
//       console.error('Error removing user', error);
    
//     }
//   };
  
//   return (
//     <AuthContext.Provider value={{ user,login, logout, isLoading }}>
//     {children}
// 	</AuthContext.Provider>
// 		);
// 	};

//    export const useAuth = () => {

//      const context = useContext(AuthContext);
     
//      if(!context) {
     
//        throw new Error('useAuth should be used within AuthProvider');
     
//      }
     
//      return context;
   
//    };