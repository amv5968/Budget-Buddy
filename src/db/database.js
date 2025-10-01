import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { mySchema } from '..src/model/schema';
import Post from '../model/Post';

// 1. Setup the adapter (using SQLite driver)
const adapter = new SQLiteAdapter({
  schema: mySchema,
});

// 2. Setup the Database instance
export const database = new Database({
  adapter,
  modelClasses: [Post], // List all your models here
  actionsEnabled: true,
});


  export const createPost = async (title, body) => {
    // All write operations must be wrapped in a database.write() call
    await database.write(async () => {
      const newPost = await database.get('posts').create(post => {
        post.title = title;
        post.body = body;
        post.isDraft = true;
      });
      console.log("New Post ID:", newPost.id);
    });
  };
  