import axios from 'axios';
import 'dotenv/config';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST;

const apiClient = axios.create({
  baseURL: `https://${RAPIDAPI_HOST}`,
  headers: {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST
  }
});

/**
 * Get user profile picture
 */
export const getUserDP = async (username) => {
  try {
    const response = await apiClient.get('/get_user_info_v2.php', {
      params: { username_or_url: username }
    });
    
    // The API response structure varies, so we use optional chaining
    const data = response.data?.data;
    const avatar = data?.profile_pic_url_hd || data?.profile_pic_url;
    
    if (!avatar) throw new Error('Profile picture not found');
    return avatar;
  } catch (error) {
    console.error('RapidAPI DP Error:', error.response?.data || error.message);
    throw new Error('Could not fetch profile picture via API.');
  }
};

/**
 * Get media URLs for a post or reel (Handles high quality & carousels)
 */
export const getPostMedia = async (url) => {
  try {
    const response = await apiClient.get('/get_post_info_v2.php', {
      params: { url_or_shortcode: url }
    });

    const data = response.data?.data;
    if (!data) throw new Error('Media data not found in API response');

    // Handle Carousels (multiple items)
    if (data.carousel_media && data.carousel_media.length > 0) {
      const media = data.carousel_media.map(item => ({
        url: item.video_url || item.image_url || item.display_url,
        type: item.video_url || item.is_video ? 'video' : 'photo'
      }));
      return {
        media,
        caption: data.caption?.text || 'InstaSaver Download',
        username: data.user?.username || 'instagram_user',
        likes: data.like_count || 0
      };
    }

    // Single item (Photo/Video/Reel)
    const mediaUrl = data.video_url || data.image_url || data.display_url;
    const isVideo = data.video_url || data.is_video || false;

    return {
      media: [{
        url: mediaUrl,
        type: isVideo ? 'video' : 'photo'
      }],
      caption: data.caption?.text || 'InstaSaver Download',
      username: data.user?.username || 'instagram_user',
      likes: data.like_count || 0
    };
  } catch (error) {
    console.error('RapidAPI Media Error:', error.response?.data || error.message);
    throw new Error('Failed to fetch media. Post might be private or API limit reached.');
  }
};

/**
 * Get user's latest posts
 */
export const getUserPosts = async (username, count = 3) => {
  try {
    const response = await apiClient.get('/get_user_posts.php', {
      params: { username_or_url: username }
    });

    const posts = response.data?.data?.items || [];
    if (posts.length === 0) throw new Error('No public posts found.');

    return posts.slice(0, count).map(p => ({
      id: p.id,
      shortcode: p.code,
      photo: p.image_url || p.display_url,
      isVideo: p.is_video || !!p.video_url,
      description: p.caption?.text || '',
      time: p.taken_at,
      username: username
    }));
  } catch (error) {
    console.error('RapidAPI User Posts Error:', error.response?.data || error.message);
    throw new Error('Could not fetch latest posts.');
  }
};

/**
 * Get Story Media
 */
export const getStoryMedia = async (url) => {
  try {
    // Determine if it's a URL or username
    const username = url.includes('instagram.com') ? url.match(/stories\/([a-zA-Z0-9._]+)/)?.[1] : url;
    
    const response = await apiClient.get('/get_user_stories.php', {
      params: { username_or_url: username }
    });

    const stories = response.data?.data?.items || [];
    if (stories.length === 0) throw new Error('No active stories found for this user.');

    // If it's a specific story link, try to find that specific one
    const storyId = url.match(/stories\/[a-zA-Z0-9._]+\/([0-9]+)/)?.[1];
    let selectedStories = stories;
    
    if (storyId) {
      const match = stories.find(s => s.id === storyId || s.pk === storyId);
      if (match) selectedStories = [match];
    }

    return selectedStories.map(s => ({
      url: s.video_url || s.image_url || s.display_url,
      type: s.is_video || !!s.video_url ? 'video' : 'photo',
      caption: `Story by @${username}`
    }));
  } catch (error) {
    console.error('RapidAPI Story Error:', error.response?.data || error.message);
    throw new Error('Failed to fetch stories.');
  }
};
