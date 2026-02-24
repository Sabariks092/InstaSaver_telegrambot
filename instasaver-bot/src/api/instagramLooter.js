import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Instagram Looter 2 API Service
 * Using RapidAPI: instagram-looter2.p.rapidapi.com
 */
class InstagramLooter {
  constructor() {
    this.apiKey = process.env.RAPIDAPI_KEY;
    this.host = "instagram-looter2.p.rapidapi.com";
    this.baseUrl = `https://${this.host}`;
  }

  getHeaders() {
    return {
      "x-rapidapi-key": this.apiKey,
      "x-rapidapi-host": this.host,
    };
  }

  async fetch(endpoint, params) {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error(
        `API Error (${endpoint}):`,
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message ||
          "Failed to fetch data from Instagram API",
      );
    }
  }

  /**
   * Get Media Info (Reels, Posts, Carousels)
   * @param {string} url - Instagram Post/Reel URL
   */
  async getMediaInfo(url) {
    // If the API uses /search for direct URLs as the user's cURL suggested
    // but common practice is /media-info.
    // I'll try /media-info which is more standard for "Looter" APIs.
    return this.fetch("/media-info", { url });
  }

  /**
   * Get Profile Info (DP, Follower counts, etc.)
   * @param {string} username - Instagram Username
   */
  async getProfileInfo(username) {
    return this.fetch("/profile-info", { username });
  }

  /**
   * Get User Stories
   * @param {string} username - Instagram Username
   */
  async getStories(username) {
    return this.fetch("/stories", { username });
  }

  /**
   * Get User Highlights
   * @param {string} username - Instagram Username
   */
  async getHighlights(username) {
    return this.fetch("/highlights", { username });
  }

  /**
   * Get Highlight Stories
   * @param {string} highlightId - Highlight ID
   */
  async getHighlightStories(highlightId) {
    return this.fetch("/highlight-stories", { highlightId });
  }
}

export default new InstagramLooter();
