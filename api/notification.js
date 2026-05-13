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

export const subscribeNotifications = (receiverId, onNotification) => {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/stream?receiverId=${receiverId}`;
  const es = new EventSource(url);

  es.addEventListener('notification', (e) => {
    try {
      onNotification(JSON.parse(e.data));
    } catch {
      // 파싱 실패 무시
    }
  });

  es.onerror = () => {
    es.close();
  };

  return es;
};
