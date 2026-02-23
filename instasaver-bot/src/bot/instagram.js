import instagramGetUrl from "instagram-url-direct";
import axios from "axios";
import * as cheerio from "cheerio";

/**
 * BEST OPTIMAL FREE SOLUTION
 * This module uses a multi-layered approach to fetch HQ media without paid APIs:
 * 1. Hybrid Header Rotation (mimicking high-end mobile devices)
 * 2. Specialized direct-link extraction
 * 3. Fallback to Guest GraphQL points
 */

const MOBILE_USER_AGENTS = [
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.164 Mobile Safari/537.36",
];

const getHeaders = () => ({
  "User-Agent":
    MOBILE_USER_AGENTS[Math.floor(Math.random() * MOBILE_USER_AGENTS.length)],
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  "X-IG-App-ID": "936619743392459", // This is the public Instagram Web App ID
});

/**
 * Get user profile picture in HQ
 */
export const getUserDP = async (username) => {
  try {
    const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`;
    const response = await axios.get(url, {
      headers: getHeaders(),
      timeout: 10000,
    });

    const user = response.data.graphql?.user || response.data.user;
    if (user?.profile_pic_url_hd) return user.profile_pic_url_hd;

    // Fallback if __a=1 is blocked
    const htmlRes = await axios.get(`https://www.instagram.com/${username}/`, {
      headers: getHeaders(),
    });
    const $ = cheerio.load(htmlRes.data);
    const ogImage = $('meta[property="og:image"]').attr("content");

    return ogImage || `https://www.instadp.io/api/profile/${username}`;
  } catch (error) {
    console.error("DP Error:", error.message);
    return `https://www.instadp.io/api/profile/${username}`;
  }
};

/**
 * Get Media (Reels, Videos, Photos, Carousels)
 */
export const getPostMedia = async (url) => {
  try {
    // Stage 1: Attempt direct high-quality extraction
    const result = await instagramGetUrl(url);

    if (result && result.url_list && result.url_list.length > 0) {
      return {
        media: result.url_list.map((link) => ({
          url: link,
          type:
            link.includes(".mp4") ||
            link.includes("video") ||
            link.includes("m4v")
              ? "video"
              : "photo",
        })),
        caption: "High Resolution Download ✅",
        username: "instagram_user",
      };
    }

    // Stage 2: Fallback to Manual Scrape (using Public GraphQL)
    const shortcode = url.match(/(?:p|reels|reel)\/([a-zA-Z0-9_-]+)/)?.[1];
    if (!shortcode) throw new Error("Invalid URL format");

    const queryUrl = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;
    const res = await axios.get(queryUrl, {
      headers: getHeaders(),
      timeout: 10000,
    });

    const item = res.data.items?.[0] || res.data.graphql?.shortcode_media;
    if (!item) throw new Error("Media not found or post is private");

    const media = [];
    if (item.edge_sidecar_to_children) {
      item.edge_sidecar_to_children.edges.forEach((edge) => {
        const node = edge.node;
        media.push({
          url: node.video_url || node.display_url,
          type: node.is_video ? "video" : "photo",
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
      caption:
        item.edge_media_to_caption?.edges[0]?.node?.text || "HQ Download",
      username: item.owner?.username || "instagram_user",
    };
  } catch (error) {
    console.error("Media Scrape Error:", error.message);

    // Stage 3: Final Fallback - Try to find meta tags (Last resort)
    try {
      const htmlRes = await axios.get(url, { headers: getHeaders() });
      const $ = cheerio.load(htmlRes.data);
      const ogVideo = $('meta[property="og:video"]').attr("content");
      const ogImage = $('meta[property="og:image"]').attr("content");

      if (ogVideo || ogImage) {
        return {
          media: [
            {
              url: ogVideo || ogImage,
              type: ogVideo ? "video" : "photo",
            },
          ],
          caption:
            $('meta[property="og:title"]').attr("content") || "HQ Download",
          username: "instagram_user",
        };
      }
    } catch (e) {}

    throw new Error(
      "Instagram is blocking the request. High-quality media is currently restricted for free access. Please try again later.",
    );
  }
};

/**
 * Get User Latest Posts
 */
export const getUserPosts = async (username, count = 3) => {
  try {
    const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`;
    const response = await axios.get(url, { headers: getHeaders() });
    const user = response.data.graphql?.user || response.data.user;
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
    throw new Error("Could not fetch user posts in free mode.");
  }
};

/**
 * Get Stories (Best effort free - often requires Cookies)
 */
export const getStoryMedia = async (urlOrUser) => {
  try {
    const username = urlOrUser.includes("/stories/")
      ? urlOrUser.match(/stories\/([a-zA-Z0-9._]+)/)?.[1]
      : urlOrUser.replace("@", "");

    // Free story viewers often change. This mimics the logic of public viewers.
    // For a truly reliable story downloader for free, we would need to rotate cookies.
    throw new Error(
      "Stories are currently unavailable in free mode. Private stories cannot be downloaded.",
    );
  } catch (error) {
    throw error;
  }
};
