// src/db/database.js
import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

// Import schema and model
import Post from '../../model/Post'
import schema from '../../model/schema'

// Create the SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  dbName: 'MyAppDB',
})

// Initialize the WatermelonDB database
const database = new Database({
  adapter,
  modelClasses: [Post],
  actionsEnabled: true,
})

// Named export for creating a new post
const createPost = async (title, body) => {
  await database.write(async () => {
    await database.get('posts').create(post => {
      post.title = title
      post.body = body
    })
  })
}

export { database, createPost }
