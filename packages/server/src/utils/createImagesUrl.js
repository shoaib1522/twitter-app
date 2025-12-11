module.exports = {
  createUserAvatarUrl: email => {
    // Using DiceBear Avatars API - free, reliable alternative to adorable.io
    // Creates consistent avatars based on email hash
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}&scale=80`;
  },
};
