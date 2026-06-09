import axios from 'axios';

const BASE = `${process.env.REACT_APP_BACKEND_URL}/api/media`;

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('session_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// ─── Profile ─────────────────────────────────────────────────────────────────
export const getMyProfile = () => api.get('/profile/me').then(r => r.data);
export const updateMyProfile = (data) => api.put('/profile/me', data).then(r => r.data);
export const getProfile = (handle) => api.get(`/profile/${handle}`).then(r => r.data);
export const getProfilePosts = (handle, params) => api.get(`/profile/${handle}/posts`, { params }).then(r => r.data);
export const getFollowers = (handle) => api.get(`/profile/${handle}/followers`).then(r => r.data);
export const getFollowing = (handle) => api.get(`/profile/${handle}/following`).then(r => r.data);
export const followUser = (userId) => api.post(`/follow/${userId}`).then(r => r.data);
export const unfollowUser = (userId) => api.delete(`/follow/${userId}`).then(r => r.data);
export const getSuggestedUsers = () => api.get('/suggested-users').then(r => r.data);

// ─── Posts ────────────────────────────────────────────────────────────────────
export const createPost = (data) => api.post('/posts', data).then(r => r.data);
export const getPost = (postId) => api.get(`/posts/${postId}`).then(r => r.data);
export const deletePost = (postId) => api.delete(`/posts/${postId}`).then(r => r.data);
export const toggleLike = (postId) => api.post(`/posts/${postId}/like`).then(r => r.data);
export const toggleSave = (postId) => api.post(`/posts/${postId}/save`).then(r => r.data);
export const getBookmarks = (page) => api.get('/bookmarks', { params: { page } }).then(r => r.data);
export const reportContent = (data) => api.post('/report', data).then(r => r.data);

// ─── Comments ─────────────────────────────────────────────────────────────────
export const getComments = (postId, page) => api.get(`/posts/${postId}/comments`, { params: { page } }).then(r => r.data);
export const addComment = (postId, data) => api.post(`/posts/${postId}/comments`, data).then(r => r.data);
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`).then(r => r.data);

// ─── Feed ─────────────────────────────────────────────────────────────────────
export const getFeed = (page) => api.get('/feed', { params: { page } }).then(r => r.data);
export const getExplore = (params) => api.get('/explore', { params }).then(r => r.data);
export const getHashtagPosts = (tag, page) => api.get(`/hashtag/${tag}/posts`, { params: { page } }).then(r => r.data);

// ─── Stories ──────────────────────────────────────────────────────────────────
export const getStories = () => api.get('/stories').then(r => r.data);
export const markStorySeen = (storyId) => api.post(`/stories/${storyId}/seen`).then(r => r.data);
export const createStory = (data) => api.post('/posts', { ...data, story: true }).then(r => r.data);

// ─── Messaging ────────────────────────────────────────────────────────────────
export const getConversations = () => api.get('/conversations').then(r => r.data);
export const createConversation = (data) => api.post('/conversations', data).then(r => r.data);
export const getMessages = (convId, params) => api.get(`/conversations/${convId}/messages`, { params }).then(r => r.data);
export const sendMessage = (convId, data) => api.post(`/conversations/${convId}/messages`, data).then(r => r.data);
export const deleteMessage = (msgId) => api.delete(`/messages/${msgId}`).then(r => r.data);
export const reactToMessage = (msgId, emoji) => api.post(`/messages/${msgId}/react`, { emoji }).then(r => r.data);
export const updateConvSettings = (convId, data) => api.put(`/conversations/${convId}/settings`, data).then(r => r.data);
export const addMember = (convId, userId) => api.post(`/conversations/${convId}/members`, { user_id: userId }).then(r => r.data);
export const removeMember = (convId, memberId) => api.delete(`/conversations/${convId}/members/${memberId}`).then(r => r.data);
export const joinByInvite = (link) => api.post(`/conversations/join/${link}`).then(r => r.data);

// ─── Search ───────────────────────────────────────────────────────────────────
export const search = (q, tab, page) => api.get('/search', { params: { q, tab, page } }).then(r => r.data);

// ─── Notifications ────────────────────────────────────────────────────────────
export const getNotifications = (page) => api.get('/notifications', { params: { page } }).then(r => r.data);
export const markNotificationsRead = () => api.put('/notifications/read').then(r => r.data);

// ─── WebSocket ────────────────────────────────────────────────────────────────
export const getWsUrl = (userId) => {
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
  const wsBase = backendUrl.replace(/^https?/, (p) => (p === 'https' ? 'wss' : 'ws'));
  const token = localStorage.getItem('session_token') || '';
  return `${wsBase}/api/media/ws/${userId}?token=${encodeURIComponent(token)}`;
};
