import client from './client';

export const getNotifications = async (receiverId) => {
  const res = await client.get('/api/notifications', { params: { receiverId } });
  return res?.data ?? [];
};

export const markRead = async (notificationId) => {
  await client.put(`/api/notifications/${notificationId}/read`);
};

export const markAllRead = async (receiverId) => {
  await client.put('/api/notifications/read-all', null, { params: { receiverId } });
};

export const deleteNotification = async (notificationId) => {
  await client.delete(`/api/notifications/${notificationId}`);
};

export const deleteAllNotifications = async (receiverId) => {
  await client.delete('/api/notifications', { params: { receiverId } });
};

export const subscribeNotifications = (receiverId, onNotification) => {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const url = `${base}/api/notifications/stream?receiverId=${receiverId}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const headers = { 'ngrok-skip-browser-warning': 'true' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let closed = false;
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!closed) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        let eventName = '';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (eventName === 'notification') {
              try {
                onNotification(JSON.parse(data));
              } catch {
                /* 무시 */
              }
            }
            eventName = '';
          }
        }
      }
    } catch {
      // 연결 종료 또는 오류 무시
    }
  })();

  return {
    close: () => {
      closed = true;
      controller.abort();
    },
  };
};
