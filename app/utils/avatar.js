const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e, #16213e)',
  'linear-gradient(135deg, #e43a15, #e65c00)',
  'linear-gradient(135deg, #232526, #414345)',
  'linear-gradient(135deg, #004e92, #000428)',
  'linear-gradient(135deg, #f7f8f8, #acbb78)',
  'linear-gradient(135deg, #373b44, #4286f4)',
  'linear-gradient(135deg, #c31432, #240b36)',
  'linear-gradient(135deg, #0f2027, #2c5364)',
  'linear-gradient(135deg, #f09819, #edde5d)',
  'linear-gradient(135deg, #1d2b64, #f8cdda)',
  'linear-gradient(135deg, #56ab2f, #a8e063)',
  'linear-gradient(135deg, #4b4b4b, #9b9b9b)',
];

export const avatarColor = (userId) => AVATAR_GRADIENTS[(userId || 0) % AVATAR_GRADIENTS.length];
