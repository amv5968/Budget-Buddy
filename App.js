import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { saveUser, getUser } from './src/storage/asyncStorage';
import { createPost, database } from './db/database';

// ⬇️ state first, then effect (top level only)
export default function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        await saveUser({ name: 'Akash', age: 25 });
        const u = await getUser();
        setUser(u);

        await createPost('My First Post', 'This is saved in WatermelonDB.');
        const list = await database.get('posts').query().fetch();
        setPosts(list.map(p => p._raw));
      } catch (e) {
        console.error('❌ Test error:', e);
      }
    })();
  }, []);

  return (
    <ScrollView style={{ flex: 1, padding: 20, marginTop: 50 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>Storage Setup Test</Text>
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontWeight: 'bold' }}>AsyncStorage user:</Text>
        <Text>{user ? JSON.stringify(user) : 'Loading…'}</Text>
      </View>
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontWeight: 'bold' }}>WatermelonDB posts:</Text>
        {posts.length === 0 ? <Text>Loading…</Text> :
          posts.map(p => (
            <View key={p.id} style={{ marginTop: 8 }}>
              <Text>• {p.title}</Text>
              <Text style={{ color: '#666' }}>{p.body}</Text>
            </View>
          ))
        }
      </View>
    </ScrollView>
  );
}
