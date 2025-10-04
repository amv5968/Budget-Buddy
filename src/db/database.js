// src/db/database.js
import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

// Import your schema and Post model
import Post from '../../model/Post'
import schema from '../../model/schema'

// Create SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  dbName: 'MyAppDB',
})

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [Post],
  actionsEnabled: true,
})

// 👇 Export createPost function
export async function createPost(title, body) {
  await database.write(async () => {
    await database.get('posts').create(post => {
      post.title = title
      post.body = body
    })
  })
}
