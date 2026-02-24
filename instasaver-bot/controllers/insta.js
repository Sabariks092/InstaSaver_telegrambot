const axios = require("axios");
require("dotenv").config();

const APIKey = process.env.RAPID_API_KEY;
const APIHost = "instagram-looter2.p.rapidapi.com"; // Fixed host

const fetchFromAPI = async (endpoint, params) => {
  const options = {
    method: "GET",
    url: `https://${APIHost}${endpoint}`,
    params,
    headers: {
      "X-RapidAPI-Key": APIKey,
      "X-RapidAPI-Host": APIHost,
    },
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error(
      `API Error (${endpoint}):`,
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.message || "Failed to fetch from Instagram API",
    );
  }
};

const instaScrapper = {
  // Download Post/Reel Media
  getPostMedia: async (url) => {
    const data = await fetchFromAPI("/post-dl", { link: url });
    // Structure: data.data.medias
    return data && data.data ? data.data.medias : [];
  },

  // Get Profile Info / DP
  getProfileInfo: async (username) => {
    return await fetchFromAPI("/profile-info", { username });
  },

  // Get Stories
  getStories: async (username) => {
    const data = await fetchFromAPI("/stories", { username });
    return data && data.items ? data.items : [];
  },

  // Get Highlights
  getHighlights: async (username) => {
    return await fetchFromAPI("/highlights", { username });
  },
};

module.exports = instaScrapper;
