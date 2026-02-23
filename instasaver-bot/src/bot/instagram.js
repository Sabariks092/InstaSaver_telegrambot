import axios from "axios";
import * as cheerio from "cheerio";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

/**
 * Helper to extract JSON from Instagram HTML
 */
const extractJSON = (html) => {
  try {
    // Priority 1: __additionalDataLoaded (Current standard)
    const additionalDataMatch = html.match(
      /__additionalDataLoaded\('[^']+',\s*({.+})\);/,
    );
    if (additionalDataMatch) return JSON.parse(additionalDataMatch[1]);

    // Priority 2: _sharedData (Old standard, some pages still have it)
    const sharedDataMatch = html.match(/window\._sharedData\s?=\s?({.+});/);
    if (sharedDataMatch) return JSON.parse(sharedDataMatch[1]);

    // Priority 3: Search for any script tag containing "graphql" or "user"
    const $ = cheerio.load(html);
    let jsonData = null;
    $("script").each((i, el) => {
      const text = $(el).text();
      if (text.includes('{"user":{') || text.includes('{"shortcode_media":{')) {
        try {
          const parsed = JSON.parse(text);
          if (parsed.user || parsed.shortcode_media) jsonData = parsed;
        } catch (e) {}
      }
    });
    return jsonData;
  } catch (e) {
    return null;
  }
};

/**
 * Get user profile picture
 */
export const getUserDP = async (username) => {
  try {
    const url = `https://www.instagram.com/${username}/`;
    const response = await axios.get(url, { headers: HEADERS });
    const html = response.data;

    // Fallback: If blocked, try a public viewer or use basic regex for meta tags
    const $ = cheerio.load(html);
    const ogImage = $('meta[property="og:image"]').attr("content");

    if (ogImage) return ogImage;

    const data = extractJSON(html);
    const avatar =
      data?.user?.profile_pic_url_hd || data?.graphql?.user?.profile_pic_url_hd;

    if (!avatar) throw new Error("Could not find avatar in page source.");
    return avatar;
  } catch (error) {
    console.error("Error in getUserDP:", error.message);
    // Final fallback to a public API if scraping fails
    return `https://www.instadp.io/api/profile/${username}`;
  }
};

/**
 * Get user's latest posts
 */
export const getUserPosts = async (username, count = 3) => {
  try {
    const url = `https://www.instagram.com/${username}/`;
    const response = await axios.get(url, { headers: HEADERS });
    const data = extractJSON(response.data);

    const user = data?.user || data?.graphql?.user;
    const posts = user?.edge_owner_to_timeline_media?.edges || [];

    if (posts.length === 0) {
      throw new Error("No public posts found or Instagram is blocking access.");
    }

    return posts.slice(0, count).map((p) => {
      const node = p.node;
      return {
        id: node.id,
        shortcode: node.shortcode,
        photo: node.display_url,
        isVideo: node.is_video,
        description: node.edge_media_to_caption?.edges[0]?.node?.text || "",
        likesCount: node.edge_liked_by?.count || 0,
        commentsCount: node.edge_media_to_comment?.count || 0,
        time: node.taken_at_timestamp,
        username: username,
      };
    });
  } catch (error) {
    console.error("Error in getUserPosts:", error.message);
    throw new Error(
      "Could not fetch posts. Instagram is currently blocking common scraping methods.",
    );
  }
};

/**
 * Get media URLs for a post or reel
 */
export const getPostMedia = async (shortcode) => {
  try {
    // Method 1: Try public JSON endpoint (sometimes works with good headers)
    const jsonUrl = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;
    try {
      const jsonRes = await axios.get(jsonUrl, { headers: HEADERS });
      const item =
        jsonRes.data.items?.[0] || jsonRes.data.graphql?.shortcode_media;
      if (item) return parseMediaItem(item);
    } catch (e) {}

    // Method 2: Scrape the page directly
    const pageUrl = `https://www.instagram.com/p/${shortcode}/`;
    const pageRes = await axios.get(pageUrl, { headers: HEADERS });
    const html = pageRes.data;
    const $ = cheerio.load(html);

    // Try OpenGraph as first fallback for single media
    const ogVideo = $('meta[property="og:video"]').attr("content");
    const ogImage = $('meta[property="og:image"]').attr("content");
    const ogTitle = $('meta[property="og:title"]').attr("content") || "";

    if (ogVideo) {
      return {
        media: [{ url: ogVideo, type: "video" }],
        caption: ogTitle,
        username: "instagram_user",
        likes: 0,
      };
    } else if (ogImage) {
      return {
        media: [{ url: ogImage, type: "photo" }],
        caption: ogTitle,
        username: "instagram_user",
        likes: 0,
      };
    }

    throw new Error("Media data not found in page metadata.");
  } catch (error) {
    console.error("Error in getPostMedia:", error.message);
    throw new Error(
      "Access Denied. Instagram has strengthened its anti-scraping measures. Try again later.",
    );
  }
};

const parseMediaItem = (item) => {
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
    likes: item.edge_media_preview_like?.count || item.like_count || 0,
  };
};
