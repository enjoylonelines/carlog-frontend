const AVATAR_COLORS = ['#E03131', '#45B7D1', '#6C5CE7', '#96CEB4', '#FD9644', '#2196F3', '#FF9800'];

export const avatarColor = (userId) => AVATAR_COLORS[(userId || 0) % AVATAR_COLORS.length];
