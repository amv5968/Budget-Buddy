import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';
export default class Post extends Model {
static table = 'posts';
@field('title') title;
@field('body') body;
@field('is_draft') isDraft;
}