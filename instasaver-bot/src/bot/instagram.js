import { instagram } from "instagram-scraper-api";
import axios from "axios";

/**
 * Get user profile picture
 */
export const getUserDP = async (username) => {
  try {
    const user = await instagram.user(username);
    if (!user || user === "Error" || !user.avatar) {
      throw new Error(
        "Public profile data unavailable. It might be private or invalid.",
      );
    }
    return user.avatar;
  } catch (error) {
    console.error("Error in getUserDP:", error.message);
    throw new Error(error.message || "Could not fetch profile picture.");
  }
};

/**
 * Get user's latest posts
 */
export const getUserPosts = async (username, count = 3) => {
  try {
    const user = await instagram.user(username);
    if (!user || user === "Error" || !user.posts) {
      throw new Error(
        "Public data unavailable. Profile might be private or Instagram is blocking the request.",
      );
    }
    if (user.posts.length === 0) {
      throw new Error("No public posts found for this user.");
    }
    return user.posts.slice(0, count).map((post) => ({
      ...post,
      username: username,
    }));
  } catch (error) {
    console.error("Error in getUserPosts:", error.message);
    throw new Error(error.message || "Could not fetch user posts.");
  }
};

/**
 * Get media URLs for a post or reel
 * Since instagram-scraper-api limited, we enhance it
 */
export const getPostMedia = async (shortcode) => {
  try {
    // Attempt to fetch via public API or scraping if library doesn't support specific post
    // For now, we try to use the user scraper and find the post if we have the username
    // But if we only have shortcode, we might need a direct fetch

    // Note: Public scraping of /p/shortcode is hard without headers.
    // We'll use a known public API proxy or try to scrape the page.
    const url = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const data = response.data;
    const mediaData = data.items?.[0] || data.graphql?.shortcode_media;

    if (!mediaData) {
      throw new Error("Media not found or post is private.");
    }

    const media = [];
    if (mediaData.edge_sidecar_to_children) {
      mediaData.edge_sidecar_to_children.edges.forEach((edge) => {
        media.push({
          url: edge.node.video_url || edge.node.display_url,
          type: edge.node.is_video ? "video" : "photo",
        });
      });
    } else {
      media.push({
        url: mediaData.video_url || mediaData.display_url,
        type: mediaData.is_video ? "video" : "photo",
      });
    }

    return {
      media,
      caption: mediaData.edge_media_to_caption?.edges[0]?.node?.text || "",
      username: mediaData.owner?.username || "instagram_user",
      likes: mediaData.edge_media_preview_like?.count || 0,
    };
  } catch (error) {
    console.error("Error in getPostMedia:", error.message);
    throw new Error(
      "Could not fetch post media. It might be private or deleted.",
    );
  }
};
