import express, { Request, Response } from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createRoom,
  joinRoom,
  getRoom,
  toggleReady,
  submitAnswer,
  useLifeline,
  requestRematch,
  leaveRoom,
  registerHeartbeat,
  enterMatchmakingQueue,
  pingMatchmakingQueue,
  cancelMatchmakingQueue
} from './src/server/gameServer';
import {
  syncUserSocialProfile,
  searchPlayers,
  sendFriendRequest,
  respondFriendRequest,
  cancelFriendRequest,
  removeFriend,
  blockUser,
  unblockUser,
  sendChallenge,
  respondChallenge,
  cancelChallenge,
  markNotificationRead,
  markAllNotificationsRead,
  getSocialStateForUser
} from './src/server/socialServer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API Routes - Matchmaking ("مواجهة سريعة")
app.post('/api/matchmaking/join', (req: Request, res: Response) => {
  try {
    const { player, category } = req.body;
    if (!player || !player.id || !player.name) {
      return res.status(400).json({ error: 'بيانات اللاعب غير مكتملة.' });
    }
    const result = enterMatchmakingQueue(player, category || 'all');
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/matchmaking/ping', (req: Request, res: Response) => {
  try {
    const { playerId } = req.body;
    if (!playerId) {
      return res.status(400).json({ error: 'معرف اللاعب مطلوب.' });
    }
    const result = pingMatchmakingQueue(playerId);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر تحديث البحث';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/matchmaking/cancel', (req: Request, res: Response) => {
  try {
    const { playerId } = req.body;
    if (playerId) {
      cancelMatchmakingQueue(playerId);
    }
    return res.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر إلغاء البحث';
    return res.status(500).json({ error: msg });
  }
});

// API Routes - Rooms
app.post('/api/rooms', (req: Request, res: Response) => {
  try {
    const { hostPlayer, category, questionCount, secondsPerQuestion } = req.body;
    if (!hostPlayer || !hostPlayer.id || !hostPlayer.name) {
      return res.status(400).json({ error: 'بيانات صانع الغرفة غير مكتملة.' });
    }
    const result = createRoom(hostPlayer, category, questionCount, secondsPerQuestion);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/rooms/join', (req: Request, res: Response) => {
  try {
    const { roomId, guestPlayer } = req.body;
    if (!roomId || !guestPlayer || !guestPlayer.id || !guestPlayer.name) {
      return res.status(400).json({ error: 'يرجى إدخال رمز الغرفة واسم اللاعب.' });
    }
    const result = joinRoom(roomId, guestPlayer);
    if (result.error) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر الاتصال بالخادم';
    return res.status(500).json({ error: msg });
  }
});

app.get('/api/rooms/:id', (req: Request, res: Response) => {
  try {
    const playerId = req.query.playerId as string | undefined;
    const room = getRoom(req.params.id, playerId);
    if (!room) {
      return res.status(404).json({ error: 'الغرفة غير موجودة', errorCode: 'ROOM_NOT_FOUND' });
    }
    return res.json({ room });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر الاتصال بالخادم';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/rooms/:id/ready', (req: Request, res: Response) => {
  try {
    const { playerId } = req.body;
    const result = toggleReady(req.params.id, playerId);
    if (!result.room) {
      return res.status(404).json(result);
    }
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء تعديل الجاهزية';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/rooms/:id/answer', (req: Request, res: Response) => {
  try {
    const { playerId, questionIndex, option } = req.body;
    const result = submitAnswer(req.params.id, playerId, Number(questionIndex), option);
    if (!result.room) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء إرسال الإجابة';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/rooms/:id/lifeline', (req: Request, res: Response) => {
  try {
    const { playerId, lifelineType } = req.body;
    const result = useLifeline(req.params.id, playerId, lifelineType);
    if (!result.response.room) {
      return res.status(400).json(result.response);
    }
    return res.json({ room: result.response.room, payload: result.payload });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'حدث خطأ أثناء تفعيل وسيلة المساعدة';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/rooms/:id/rematch', (req: Request, res: Response) => {
  try {
    const { playerId } = req.body;
    const result = requestRematch(req.params.id, playerId);
    if (!result.room) {
      return res.status(400).json(result);
    }
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر طلب إعادة المباراة';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/rooms/:id/leave', (req: Request, res: Response) => {
  try {
    const { playerId } = req.body;
    const result = leaveRoom(req.params.id, playerId);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر مغادرة الغرفة';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/rooms/:id/heartbeat', (req: Request, res: Response) => {
  try {
    const { playerId } = req.body;
    const result = registerHeartbeat(req.params.id, playerId);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر تسجيل الاتصال';
    return res.status(500).json({ error: msg });
  }
});

// API Routes - Social & Friends
app.post('/api/social/sync', (req: Request, res: Response) => {
  try {
    const { user } = req.body;
    if (!user || !user.id || !user.name) {
      return res.status(400).json({ error: 'بيانات الحساب غير مكتملة' });
    }
    const synced = syncUserSocialProfile(user);
    const state = getSocialStateForUser(synced.id);
    return res.json({ user: synced, state });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر مزامنة الملف الاجتماعي';
    return res.status(500).json({ error: msg });
  }
});

app.get('/api/social/state', (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: 'معرف المستخدم مطلوب' });
    }
    const state = getSocialStateForUser(userId);
    return res.json({ state });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر جلب الحالة الاجتماعية';
    return res.status(500).json({ error: msg });
  }
});

app.get('/api/social/search', (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const userId = (req.query.userId as string) || '';
    if (!q.trim()) return res.json({ results: [] });
    const results = searchPlayers(q, userId);
    return res.json({ results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر إجراء البحث';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/social/friends/request', (req: Request, res: Response) => {
  try {
    const { senderId, target } = req.body;
    const result = sendFriendRequest(senderId, target);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر إرسال طلب الصداقة';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/social/friends/respond', (req: Request, res: Response) => {
  try {
    const { requestId, userId, action } = req.body;
    const result = respondFriendRequest(requestId, userId, action);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر الرد على طلب الصداقة';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/social/friends/cancel', (req: Request, res: Response) => {
  try {
    const { requestId, userId } = req.body;
    const result = cancelFriendRequest(requestId, userId);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر إلغاء الطلب';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/social/friends/remove', (req: Request, res: Response) => {
  try {
    const { userId, friendId } = req.body;
    const result = removeFriend(userId, friendId);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر إزالة الصديق';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/social/block', (req: Request, res: Response) => {
  try {
    const { blockerId, targetId } = req.body;
    const result = blockUser(blockerId, targetId);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر حظر اللاعب';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/social/unblock', (req: Request, res: Response) => {
  try {
    const { blockerId, targetId } = req.body;
    const result = unblockUser(blockerId, targetId);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر إلغاء الحظر';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/social/challenges/send', (req: Request, res: Response) => {
  try {
    const { challengerId, friendId, category } = req.body;
    const result = sendChallenge(challengerId, friendId, category);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر إرسال التحدي';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/social/challenges/respond', (req: Request, res: Response) => {
  try {
    const { challengeId, userId, action } = req.body;
    const result = respondChallenge(challengeId, userId, action);
    if (!result.success) return res.status(400).json(result);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر الرد على التحدي';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/social/challenges/cancel', (req: Request, res: Response) => {
  try {
    const { challengeId, userId } = req.body;
    const result = cancelChallenge(challengeId, userId);
    return res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'تعذر إلغاء التحدي';
    return res.status(500).json({ error: msg });
  }
});

app.post('/api/social/notifications/read', (req: Request, res: Response) => {
  try {
    const { userId, notifId } = req.body;
    markNotificationRead(userId, notifId);
    return res.json({ success: true });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'تعذر التحديث' });
  }
});

app.post('/api/social/notifications/read-all', (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    markAllNotificationsRead(userId);
    return res.json({ success: true });
  } catch (err: unknown) {
    return res.status(500).json({ error: 'تعذر التحديث' });
  }
});

// Real-time SSE Stream
app.get('/api/rooms/:id/stream', (req: Request, res: Response) => {
  const roomId = req.params.id;
  const playerId = req.query.playerId as string | undefined;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendRoomUpdate = () => {
    const room = getRoom(roomId, playerId);
    if (room) {
      res.write(`data: ${JSON.stringify(room)}\n\n`);
    }
  };

  sendRoomUpdate();
  const interval = setInterval(sendRoomUpdate, 800);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Vite Middleware for Dev or Static Files for Prod
async function startApp() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startApp().catch(err => {
  console.error('Failed to start server:', err);
});
