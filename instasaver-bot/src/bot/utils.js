export const formatCaption = (post) => {
  const date = new Date(post.time * 1000).toLocaleDateString();
  return `
📝 ${post.description || "No caption"}

👤 User: ${post.username || "N/A"}
📅 Date: ${date}
❤️ Likes: ${post.likesCount || 0}
💬 Comments: ${post.commentsCount || 0}
🔗 Link: https://instagram.com/p/${post.shortcode}
  `.trim();
};

export const parseUsername = (text) => {
  // Handle full URLs
  if (text.includes("instagram.com/")) {
    const parts = text.split("/");
    const userIndex = parts.findIndex((p) => p.includes("instagram.com")) + 1;
    return parts[userIndex]?.split("?")[0] || null;
  }
  // Handle @username or just username
  const match = text.match(/@?([a-zA-Z0-9._]+)/);
  return match ? match[1] : null;
};

export const parseShortcode = (url) => {
  const match = url.match(/(?:p|reels|reel)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};
