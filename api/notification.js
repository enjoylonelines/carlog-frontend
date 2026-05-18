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

export const subscribeNotifications = (receiverId, onNotification, onRemoved) => {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const url = `${base}/api/notifications/stream?receiverId=${receiverId}`;

  let closed = false;
  let currentController = null;

  const connect = async () => {
    if (closed) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    currentController = new AbortController();

    try {
      const res = await fetch(url, { headers, signal: currentController.signal });
      if (!res.ok || !res.body) throw new Error('SSE 연결 실패');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let eventName = '';

      while (!closed) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
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
            } else if (eventName === 'board_deleted') {
              try {
                onRemoved?.({ type: 'BOARD_DELETED', boardId: Number(data) });
              } catch {
                /* 무시 */
              }
            } else if (eventName === 'notification_removed') {
              try {
                onRemoved?.(JSON.parse(data));
              } catch {
                /* 무시 */
              }
            }
            eventName = '';
          }
        }
      }
    } catch {
      // abort 시에는 재연결 안 함
      // catch 없으면 에러를 위로 전파 > setTimeout 실행 x
    }

    // 연결이 끊겼고 닫힌 게 아니면 3초 후 재연결
    if (!closed) {
      setTimeout(connect, 3000);
    }
  };

  connect();

  return {
    close: () => {
      closed = true;
      currentController?.abort();
    },
  };
};
