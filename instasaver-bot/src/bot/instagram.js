import instagramGetUrl from "instagram-url-direct";
import axios from "axios";
import * as cheerio from "cheerio";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.instagram.com/",
  Connection: "keep-alive",
};

/**
 * Get user profile picture in high quality
 */
export const getUserDP = async (username) => {
  try {
    const response = await axios.get(
      `https://www.instagram.com/${username}/?__a=1&__d=dis`,
      { headers: HEADERS },
    );
    const user = response.data.graphql?.user || response.data.user;
    if (user?.profile_pic_url_hd) return user.profile_pic_url_hd;

    // Fallback scrape
    const htmlRes = await axios.get(`https://www.instagram.com/${username}/`, {
      headers: HEADERS,
    });
    const $ = cheerio.load(htmlRes.data);
    const ogImage = $('meta[property="og:image"]').attr("content");
    if (ogImage) return ogImage;

    throw new Error("DP not found");
  } catch (error) {
    console.error("DP Fetch Error:", error.message);
    return `https://www.instadp.io/api/profile/${username}`;
  }
};

/**
 * Get media URLs (Handles Reels, Videos, Carousels)
 */
export const getPostMedia = async (url) => {
  try {
    // Primary: Use specialized library for high-quality direct links
    const result = await instagramGetUrl(url);

    if (result && result.url_list && result.url_list.length > 0) {
      return {
        media: result.url_list.map((link) => ({
          url: link,
          type:
            link.includes(".mp4") || link.includes("video") ? "video" : "photo",
        })),
        caption: "Downloaded via InstaSaver",
        username: "instagram_user",
      };
    }

    // Secondary: Manual Extract if library fails
    const shortcode = url.match(/(?:p|reels|reel)\/([a-zA-Z0-9_-]+)/)?.[1];
    const res = await axios.get(
      `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`,
      { headers: HEADERS },
    );
    const item = res.data.items?.[0] || res.data.graphql?.shortcode_media;

    if (item) {
      const media = [];
      if (item.edge_sidecar_to_children) {
        item.edge_sidecar_to_children.edges.forEach((edge) => {
          media.push({
            url: edge.node.video_url || edge.node.display_url,
            type: edge.node.is_video ? "video" : "photo",
          });
        });
      } else {
        media.push({
          url: item.video_url || item.display_url,
          type: item.is_video ? "video" : "photo",
        });
      }
      return {
        media,
        caption: item.edge_media_to_caption?.edges[0]?.node?.text || "",
        username: item.owner?.username || "instagram_user",
      };
    }

    throw new Error("No media found");
  } catch (error) {
    console.error("Post Media Error:", error.message);
    throw new Error(
      "Failed to fetch media in high quality. The post might be private or Instagram is blocking the request.",
    );
  }
};

/**
 * Get user's latest posts (High Quality)
 */
export const getUserPosts = async (username, count = 3) => {
  try {
    const res = await axios.get(
      `https://www.instagram.com/${username}/?__a=1&__d=dis`,
      { headers: HEADERS },
    );
    const user = res.data.graphql?.user || res.data.user;
    const posts = user?.edge_owner_to_timeline_media?.edges || [];

    return posts.slice(0, count).map((p) => ({
      id: p.node.id,
      shortcode: p.node.shortcode,
      photo: p.node.display_url,
      isVideo: p.node.is_video,
      description: p.node.edge_media_to_caption?.edges[0]?.node?.text || "",
      time: p.node.taken_at_timestamp,
      username: username,
    }));
  } catch (error) {
    throw new Error("Could not fetch user posts.");
  }
};

/**
 * Get Story Media (Stub - requires session ID for production)
 */
export const getStoryMedia = async (username) => {
  throw new Error(
    "Story download requires session login. Currently only public posts/reels are supported.",
  );
};
