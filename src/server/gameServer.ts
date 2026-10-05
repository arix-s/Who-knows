import { generateMatchQuestions, Question } from '../data/questionRepository';
import {
  Player,
  RoomState,
  PlayerAnswer,
  AudiencePollResult,
  ClientQuestion,
  ServerActionResponse
} from '../types/game';

// In-memory server stores
const roomsStore: Map<string, { roomState: RoomState; rawQuestions: Question[] }> = new Map();

export interface MatchmakingQueueEntry {
  playerId: string;
  name: string;
  avatar: string;
  category: string;
  queuedAt: number;
  lastPing: number;
  matchedRoomId?: string;
}

const matchmakingQueue: Map<string, MatchmakingQueueEntry> = new Map();

/**
 * Generate 6-char room code
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate random session token
 */
export function generateSessionToken(): string {
  return `st_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Purge stale queue entries (> 8 seconds without ping)
 */
function purgeStaleQueue() {
  const now = Date.now();
  for (const [pId, entry] of matchmakingQueue.entries()) {
    if (now - entry.lastPing > 8000 && !entry.matchedRoomId) {
      matchmakingQueue.delete(pId);
    }
  }
}

/**
 * Enter Realtime Matchmaking ("مواجهة سريعة")
 */
export function enterMatchmakingQueue(
  player: { id: string; name: string; avatar: string },
  category: string = 'all'
): { status: 'searching' | 'matched'; room?: RoomState } {
  purgeStaleQueue();

  const now = Date.now();
  const pId = player.id;

  // Check if player is already matched in queue
  const existing = matchmakingQueue.get(pId);
  if (existing && existing.matchedRoomId) {
    const room = getRoom(existing.matchedRoomId, pId);
    if (room) {
      matchmakingQueue.delete(pId);
      return { status: 'matched', room };
    }
  }

  // Search for an available candidate in queue
  let candidate: MatchmakingQueueEntry | null = null;
  for (const [cId, entry] of matchmakingQueue.entries()) {
    if (cId !== pId && !entry.matchedRoomId) {
      if (entry.category === category || category === 'all' || entry.category === 'all') {
        candidate = entry;
        break;
      }
    }
  }

  if (candidate) {
    // Match Found! Create 1v1 game room
    const code = generateRoomCode();
    const rawQuestions = generateMatchQuestions(code, category === 'all' ? candidate.category : category, 10);

    const hostPlayer: Player = {
      id: candidate.playerId,
      sessionToken: generateSessionToken(),
      name: candidate.name,
      avatar: candidate.avatar,
      isHost: true,
      ready: true,
      score: 0,
      answers: {},
      lifelines: { fiftyFiftyUsed: false, audienceUsed: false, freezeUsed: false },
      lastSeen: now,
      connectionStatus: 'connected',
      disconnectedAt: null
    };

    const guestPlayer: Player = {
      id: pId,
      sessionToken: generateSessionToken(),
      name: player.name.trim(),
      avatar: player.avatar,
      isHost: false,
      ready: true,
      score: 0,
      answers: {},
      lifelines: { fiftyFiftyUsed: false, audienceUsed: false, freezeUsed: false },
      lastSeen: now,
      connectionStatus: 'connected',
      disconnectedAt: null
    };

    const roomState: RoomState = {
      id: code,
      category: category === 'all' ? candidate.category : category,
      questionCount: 10,
      secondsPerQuestion: 15,
      status: 'countdown', // Trigger immediate pre-match countdown!
      currentQuestionIndex: 0,
      questionStartTime: 0,
      questionDurationMs: 15000,
      countdownStartTime: now,
      questions: [],
      host: hostPlayer,
      guest: guestPlayer,
      rematchVotes: [],
      winnerId: null,
      removedOptionsMap: {},
      audiencePollMap: {},
      lastUpdated: now,
      createdAt: now
    };

    saveRoomInternal(roomState, rawQuestions);

    // Update candidate entry with matchedRoomId so candidate's ping finds it immediately
    candidate.matchedRoomId = code;
    matchmakingQueue.delete(pId);

    return { status: 'matched', room: sanitizeRoomForClient(roomState, rawQuestions) };
  }

  // No match currently available -> Add player to queue
  matchmakingQueue.set(pId, {
    playerId: pId,
    name: player.name.trim(),
    avatar: player.avatar,
    category,
    queuedAt: now,
    lastPing: now
  });

  return { status: 'searching' };
}

/**
 * Ping matchmaking queue
 */
export function pingMatchmakingQueue(
  playerId: string
): { status: 'searching' | 'matched' | 'timeout' | 'not_in_queue'; room?: RoomState } {
  purgeStaleQueue();

  const entry = matchmakingQueue.get(playerId);
  if (!entry) {
    return { status: 'not_in_queue' };
  }

  entry.lastPing = Date.now();

  if (entry.matchedRoomId) {
    const room = getRoom(entry.matchedRoomId, playerId);
    matchmakingQueue.delete(playerId);
    if (room) {
      return { status: 'matched', room };
    }
  }

  // Search timeout after 30s
  if (Date.now() - entry.queuedAt >= 30000) {
    matchmakingQueue.delete(playerId);
    return { status: 'timeout' };
  }

  return { status: 'searching' };
}

/**
 * Cancel matchmaking search
 */
export function cancelMatchmakingQueue(playerId: string): { success: boolean } {
  matchmakingQueue.delete(playerId);
  return { success: true };
}

/**
 * Sanitize RoomState for client consumption (strip correct answers during active play)
 */
export function sanitizeRoomForClient(room: RoomState, rawQuestions: Question[]): RoomState {
  const sanitizedQuestions: ClientQuestion[] = rawQuestions.map((q, idx) => {
    // Only expose correctAnswer if in reveal phase for this question or if match finished
    const isRevealed =
      room.status === 'finished' ||
      (room.status === 'round_result' && room.currentQuestionIndex === idx);

    return {
      id: q.id,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
      category: q.category,
      ...(isRevealed ? { correctAnswer: q.correctAnswer } : {})
    };
  });

  return {
    ...room,
    questions: sanitizedQuestions
  };
}

/**
 * Get room and check timer & expiration
 */
export function getRoom(roomId: string, requestingPlayerId?: string): RoomState | null {
  const cleanId = roomId.toUpperCase().trim();
  const entry = roomsStore.get(cleanId);
  if (!entry) return null;

  const { roomState, rawQuestions } = entry;

  // Process server room state engine
  processRoomEngine(roomState, rawQuestions);

  // Update lastSeen for requesting player if provided
  if (requestingPlayerId) {
    if (roomState.host.id === requestingPlayerId) {
      roomState.host.lastSeen = Date.now();
      roomState.host.connectionStatus = 'connected';
      roomState.host.disconnectedAt = null;
    } else if (roomState.guest && roomState.guest.id === requestingPlayerId) {
      roomState.guest.lastSeen = Date.now();
      roomState.guest.connectionStatus = 'connected';
      roomState.guest.disconnectedAt = null;
    }
  }

  saveRoomInternal(roomState, rawQuestions);
  return sanitizeRoomForClient(roomState, rawQuestions);
}

/**
 * Save room internally
 */
function saveRoomInternal(room: RoomState, rawQuestions: Question[]) {
  room.lastUpdated = Date.now();
  roomsStore.set(room.id.toUpperCase().trim(), { roomState: room, rawQuestions });
}

/**
 * Server State Machine Engine
 */
function processRoomEngine(room: RoomState, rawQuestions: Question[]) {
  const now = Date.now();

  // 1. Idle Room Auto-Expiration (15 minutes of inactivity)
  if (now - room.lastUpdated > 15 * 60 * 1000 && room.status !== 'finished' && room.status !== 'expired') {
    room.status = 'expired';
    room.expiredReason = 'انتهت صلاحية الغرفة بسب عدم النشاط.';
    return;
  }

  // 2. Disconnect Monitoring & Connection Status Badges
  const checkPlayerConnection = (player: Player) => {
    const silentDuration = now - player.lastSeen;
    if (silentDuration > 12000) {
      player.connectionStatus = 'disconnected';
      if (!player.disconnectedAt) player.disconnectedAt = now;
    } else if (silentDuration > 5000) {
      player.connectionStatus = 'reconnecting';
    } else if (silentDuration > 3000) {
      player.connectionStatus = 'weak';
    } else {
      player.connectionStatus = 'connected';
      player.disconnectedAt = null;
    }
  };

  checkPlayerConnection(room.host);
  if (room.guest) checkPlayerConnection(room.guest);

  // 3. Forfeit on prolonged disconnection (> 20s during playing)
  if (room.status === 'playing' || room.status === 'round_result') {
    if (room.host.disconnectedAt && now - room.host.disconnectedAt > 20000) {
      room.status = 'finished';
      room.winnerId = room.guest ? room.guest.id : null;
      room.expiredReason = 'انقطع اتصال صانع الغرفة نهائياً.';
      return;
    }
    if (room.guest && room.guest.disconnectedAt && now - room.guest.disconnectedAt > 20000) {
      room.status = 'finished';
      room.winnerId = room.host.id;
      room.expiredReason = 'انقطع اتصال الخصم نهائياً.';
      return;
    }
  }

  // 4. Countdown Phase Transition (3s)
  if (room.status === 'countdown') {
    if (room.countdownStartTime && now - room.countdownStartTime >= 3000) {
      room.status = 'playing';
      room.currentQuestionIndex = 0;
      room.questionStartTime = now;
      room.questionDurationMs = room.secondsPerQuestion * 1000;
    }
    return;
  }

  // 5. Playing Timer Expiration
  if (room.status === 'playing') {
    const elapsed = now - room.questionStartTime;
    if (elapsed >= room.questionDurationMs) {
      const qIdx = room.currentQuestionIndex;

      // Auto-submit timeout for missing answers
      if (!room.host.answers[qIdx]) {
        room.host.answers[qIdx] = {
          option: '',
          timeSpentSeconds: room.secondsPerQuestion,
          isCorrect: false,
          pointsEarned: 0,
          answeredAt: now
        };
      }

      if (room.guest && !room.guest.answers[qIdx]) {
        room.guest.answers[qIdx] = {
          option: '',
          timeSpentSeconds: room.secondsPerQuestion,
          isCorrect: false,
          pointsEarned: 0,
          answeredAt: now
        };
      }

      triggerRevealPhase(room);
    }
  }

  // 6. Round Result Transition (3.5s reveal phase)
  if (room.status === 'round_result') {
    const elapsed = now - room.questionStartTime;
    if (elapsed >= 3500) {
      if (room.currentQuestionIndex + 1 < rawQuestions.length) {
        room.currentQuestionIndex += 1;
        room.status = 'playing';
        room.questionStartTime = Date.now();
        room.questionDurationMs = room.secondsPerQuestion * 1000;
      } else {
        // Match Finished! Server-Authoritative Winner Calculation
        room.status = 'finished';
        const hScore = room.host.score;
        const gScore = room.guest ? room.guest.score : 0;

        if (hScore > gScore) {
          room.winnerId = room.host.id;
        } else if (gScore > hScore) {
          room.winnerId = room.guest!.id;
        } else {
          room.winnerId = 'DRAW';
        }
      }
    }
  }
}

function triggerRevealPhase(room: RoomState) {
  room.status = 'round_result';
  room.questionStartTime = Date.now();
}

/**
 * Create a new game room
 */
export function createRoom(
  hostPlayer: { id: string; name: string; avatar: string },
  category: string = 'all',
  questionCount: number = 10,
  secondsPerQuestion: number = 15
): ServerActionResponse {
  const code = generateRoomCode();
  const rawQuestions = generateMatchQuestions(code, category, questionCount);
  const sessionToken = generateSessionToken();

  const fullHost: Player = {
    id: hostPlayer.id,
    sessionToken,
    name: hostPlayer.name.trim(),
    avatar: hostPlayer.avatar,
    isHost: true,
    ready: false,
    score: 0,
    answers: {},
    lifelines: { fiftyFiftyUsed: false, audienceUsed: false, freezeUsed: false },
    lastSeen: Date.now(),
    connectionStatus: 'connected',
    disconnectedAt: null
  };

  const roomState: RoomState = {
    id: code,
    category,
    questionCount,
    secondsPerQuestion,
    status: 'waiting',
    currentQuestionIndex: 0,
    questionStartTime: 0,
    questionDurationMs: secondsPerQuestion * 1000,
    countdownStartTime: null,
    questions: [],
    host: fullHost,
    guest: null,
    rematchVotes: [],
    winnerId: null,
    removedOptionsMap: {},
    audiencePollMap: {},
    lastUpdated: Date.now(),
    createdAt: Date.now()
  };

  saveRoomInternal(roomState, rawQuestions);
  return { room: sanitizeRoomForClient(roomState, rawQuestions) };
}

/**
 * Join an existing room safely with session recovery
 */
export function joinRoom(
  roomId: string,
  guestPlayer: { id: string; name: string; avatar: string }
): ServerActionResponse {
  const cleanCode = roomId.toUpperCase().trim();
  const entry = roomsStore.get(cleanCode);

  if (!entry) {
    return { room: null, error: 'الغرفة غير موجودة. يرجى التأكد من الرمز.', errorCode: 'ROOM_NOT_FOUND' };
  }

  const { roomState, rawQuestions } = entry;
  processRoomEngine(roomState, rawQuestions);

  if (roomState.status === 'expired') {
    return { room: null, error: 'انتهت صلاحية الغرفة.', errorCode: 'ROOM_EXPIRED' };
  }

  const playerId = guestPlayer.id;

  // Session Recovery for Host
  if (roomState.host.id === playerId) {
    roomState.host.lastSeen = Date.now();
    roomState.host.connectionStatus = 'connected';
    roomState.host.disconnectedAt = null;
    saveRoomInternal(roomState, rawQuestions);
    return { room: sanitizeRoomForClient(roomState, rawQuestions) };
  }

  // Session Recovery for Guest
  if (roomState.guest && roomState.guest.id === playerId) {
    roomState.guest.lastSeen = Date.now();
    roomState.guest.connectionStatus = 'connected';
    roomState.guest.disconnectedAt = null;
    saveRoomInternal(roomState, rawQuestions);
    return { room: sanitizeRoomForClient(roomState, rawQuestions) };
  }

  // Prevent joining full or started match
  if (roomState.guest && roomState.guest.id !== playerId) {
    return { room: null, error: 'الغرفة ممتلئة ولا تتسع للاعبين آخرين.', errorCode: 'ROOM_FULL' };
  }

  if (roomState.status === 'playing' || roomState.status === 'round_result') {
    return { room: null, error: 'المباراة بدأت بالفعل.', errorCode: 'MATCH_STARTED' };
  }

  if (roomState.status === 'finished') {
    return { room: null, error: 'انتهت المباراة.', errorCode: 'MATCH_ENDED' };
  }

  // New Guest Joins
  const sessionToken = generateSessionToken();
  const fullGuest: Player = {
    id: playerId,
    sessionToken,
    name: guestPlayer.name.trim(),
    avatar: guestPlayer.avatar,
    isHost: false,
    ready: false,
    score: 0,
    answers: {},
    lifelines: { fiftyFiftyUsed: false, audienceUsed: false, freezeUsed: false },
    lastSeen: Date.now(),
    connectionStatus: 'connected',
    disconnectedAt: null
  };

  roomState.guest = fullGuest;
  saveRoomInternal(roomState, rawQuestions);
  return { room: sanitizeRoomForClient(roomState, rawQuestions) };
}

/**
 * Toggle ready state with 3-2-1 countdown trigger
 */
export function toggleReady(roomId: string, playerId: string): ServerActionResponse {
  const entry = roomsStore.get(roomId.toUpperCase().trim());
  if (!entry) return { room: null, error: 'الغرفة غير موجودة.', errorCode: 'ROOM_NOT_FOUND' };

  const { roomState, rawQuestions } = entry;
  processRoomEngine(roomState, rawQuestions);

  if (roomState.host.id === playerId) {
    roomState.host.ready = !roomState.host.ready;
  } else if (roomState.guest && roomState.guest.id === playerId) {
    roomState.guest.ready = !roomState.guest.ready;
  } else {
    return { room: null, error: 'غير مصرح للقيام بهذا الإجراء.', errorCode: 'UNAUTHORIZED' };
  }

  // If both players ready in waiting mode, start 3s countdown!
  if (roomState.status === 'waiting' && roomState.host.ready && roomState.guest && roomState.guest.ready) {
    roomState.status = 'countdown';
    roomState.countdownStartTime = Date.now();
  }

  saveRoomInternal(roomState, rawQuestions);
  return { room: sanitizeRoomForClient(roomState, rawQuestions) };
}

/**
 * Submit answer with server-authoritative score & speed bonus calculation
 */
export function submitAnswer(
  roomId: string,
  playerId: string,
  questionIndex: number,
  option: string
): ServerActionResponse {
  const entry = roomsStore.get(roomId.toUpperCase().trim());
  if (!entry) return { room: null, error: 'الغرفة غير موجودة.', errorCode: 'ROOM_NOT_FOUND' };

  const { roomState, rawQuestions } = entry;
  processRoomEngine(roomState, rawQuestions);

  if (roomState.status !== 'playing') {
    return { room: null, error: 'الإجابة غير متاحة حالياً.', errorCode: 'ACTION_INVALID' };
  }

  if (roomState.currentQuestionIndex !== questionIndex) {
    return { room: sanitizeRoomForClient(roomState, rawQuestions) };
  }

  const currentQ = rawQuestions[questionIndex];
  if (!currentQ) return { room: sanitizeRoomForClient(roomState, rawQuestions) };

  const isHost = roomState.host.id === playerId;
  const isGuest = roomState.guest && roomState.guest.id === playerId;

  if (!isHost && !isGuest) {
    return { room: null, error: 'لاعب غير معروف.', errorCode: 'UNAUTHORIZED' };
  }

  const player = isHost ? roomState.host : roomState.guest!;

  // Prevent duplicate submissions
  if (player.answers[questionIndex]) {
    return { room: sanitizeRoomForClient(roomState, rawQuestions) };
  }

  const now = Date.now();
  const timeSpentSeconds = Math.min(
    roomState.secondsPerQuestion,
    Math.max(0.2, (now - roomState.questionStartTime) / 1000)
  );

  const isCorrect = option === currentQ.correctAnswer;
  let pointsEarned = 0;

  if (isCorrect) {
    const timeRatio = Math.max(0, (roomState.secondsPerQuestion - timeSpentSeconds) / roomState.secondsPerQuestion);
    pointsEarned = 1000 + Math.round(timeRatio * 500);
  }

  player.answers[questionIndex] = {
    option,
    timeSpentSeconds: Number(timeSpentSeconds.toFixed(1)),
    isCorrect,
    pointsEarned,
    answeredAt: now
  };

  // Recalculate total score
  player.score = Object.values(player.answers).reduce((sum, a) => sum + (a.pointsEarned || 0), 0);

  // Check if both players answered
  const hostAnswered = !!roomState.host.answers[questionIndex];
  const guestAnswered = roomState.guest ? !!roomState.guest.answers[questionIndex] : false;

  if (hostAnswered && guestAnswered) {
    triggerRevealPhase(roomState);
  }

  saveRoomInternal(roomState, rawQuestions);
  return { room: sanitizeRoomForClient(roomState, rawQuestions) };
}

/**
 * Use lifeline (50:50, Audience Poll, Freeze Timer)
 */
export function useLifeline(
  roomId: string,
  playerId: string,
  lifelineType: 'fiftyFifty' | 'audience' | 'freeze'
): { response: ServerActionResponse; payload?: unknown } {
  const entry = roomsStore.get(roomId.toUpperCase().trim());
  if (!entry) return { response: { room: null, error: 'الغرفة غير موجودة.', errorCode: 'ROOM_NOT_FOUND' } };

  const { roomState, rawQuestions } = entry;
  processRoomEngine(roomState, rawQuestions);

  if (roomState.status !== 'playing') {
    return { response: { room: sanitizeRoomForClient(roomState, rawQuestions) } };
  }

  const isHost = roomState.host.id === playerId;
  const player = isHost ? roomState.host : roomState.guest;
  if (!player) return { response: { room: null, errorCode: 'UNAUTHORIZED' } };

  const qIdx = roomState.currentQuestionIndex;
  const currentQ = rawQuestions[qIdx];

  if (lifelineType === 'fiftyFifty') {
    if (player.lifelines.fiftyFiftyUsed) return { response: { room: sanitizeRoomForClient(roomState, rawQuestions) } };
    player.lifelines.fiftyFiftyUsed = true;

    const wrongChoices = currentQ.options.filter(o => o !== currentQ.correctAnswer);
    const removed = wrongChoices.sort(() => Math.random() - 0.5).slice(0, 2);

    const removedMap = roomState.removedOptionsMap || {};
    removedMap[`${playerId}-${qIdx}`] = removed;
    roomState.removedOptionsMap = removedMap;

    saveRoomInternal(roomState, rawQuestions);
    return { response: { room: sanitizeRoomForClient(roomState, rawQuestions) }, payload: { removed } };
  }

  if (lifelineType === 'audience') {
    if (player.lifelines.audienceUsed) return { response: { room: sanitizeRoomForClient(roomState, rawQuestions) } };
    player.lifelines.audienceUsed = true;

    const isEasy = currentQ.difficulty === 'سهل';
    const isHard = currentQ.difficulty === 'صعب';

    const correctMin = isEasy ? 65 : isHard ? 42 : 55;
    const correctPercent = Math.floor(correctMin + Math.random() * (90 - correctMin));
    let remaining = 100 - correctPercent;

    const wrongOptions = currentQ.options.filter(o => o !== currentQ.correctAnswer);
    const percentages: { [option: string]: number } = {};

    percentages[currentQ.correctAnswer] = correctPercent;

    wrongOptions.forEach((opt, idx) => {
      if (idx === wrongOptions.length - 1) {
        percentages[opt] = remaining;
      } else {
        const val = Math.floor(Math.random() * (remaining * 0.7));
        percentages[opt] = val;
        remaining -= val;
      }
    });

    const pollRes: AudiencePollResult = { questionIndex: qIdx, percentages };
    const pollMap = roomState.audiencePollMap || {};
    pollMap[`${playerId}-${qIdx}`] = pollRes;
    roomState.audiencePollMap = pollMap;

    saveRoomInternal(roomState, rawQuestions);
    return { response: { room: sanitizeRoomForClient(roomState, rawQuestions) }, payload: { pollRes } };
  }

  if (lifelineType === 'freeze') {
    if (player.lifelines.freezeUsed) return { response: { room: sanitizeRoomForClient(roomState, rawQuestions) } };
    player.lifelines.freezeUsed = true;
    roomState.questionDurationMs += 5000;

    saveRoomInternal(roomState, rawQuestions);
    return { response: { room: sanitizeRoomForClient(roomState, rawQuestions) }, payload: { addedMs: 5000 } };
  }

  return { response: { room: sanitizeRoomForClient(roomState, rawQuestions) } };
}

/**
 * Request or vote for rematch
 */
export function requestRematch(roomId: string, playerId: string): ServerActionResponse {
  const entry = roomsStore.get(roomId.toUpperCase().trim());
  if (!entry) return { room: null, error: 'الغرفة غير موجودة.', errorCode: 'ROOM_NOT_FOUND' };

  const { roomState } = entry;

  if (!roomState.rematchVotes.includes(playerId)) {
    roomState.rematchVotes.push(playerId);
  }

  const hostVoted = roomState.rematchVotes.includes(roomState.host.id);
  const guestVoted = roomState.guest ? roomState.rematchVotes.includes(roomState.guest.id) : false;

  if (hostVoted && guestVoted) {
    const newSeed = `${roomState.id}-RM-${Date.now()}`;
    const newRawQuestions = generateMatchQuestions(newSeed, roomState.category, roomState.questionCount);

    roomState.status = 'waiting';
    roomState.currentQuestionIndex = 0;
    roomState.rematchVotes = [];
    roomState.winnerId = null;
    roomState.removedOptionsMap = {};
    roomState.audiencePollMap = {};

    roomState.host.ready = false;
    roomState.host.score = 0;
    roomState.host.answers = {};
    roomState.host.lifelines = { fiftyFiftyUsed: false, audienceUsed: false, freezeUsed: false };

    if (roomState.guest) {
      roomState.guest.ready = false;
      roomState.guest.score = 0;
      roomState.guest.answers = {};
      roomState.guest.lifelines = { fiftyFiftyUsed: false, audienceUsed: false, freezeUsed: false };
    }

    saveRoomInternal(roomState, newRawQuestions);
    return { room: sanitizeRoomForClient(roomState, newRawQuestions) };
  }

  saveRoomInternal(roomState, entry.rawQuestions);
  return { room: sanitizeRoomForClient(roomState, entry.rawQuestions) };
}

/**
 * Handle explicit player leaving
 */
export function leaveRoom(roomId: string, playerId: string): ServerActionResponse {
  const entry = roomsStore.get(roomId.toUpperCase().trim());
  if (!entry) return { room: null, error: 'الغرفة غير موجودة.' };

  const { roomState, rawQuestions } = entry;

  if (roomState.host.id === playerId) {
    if (roomState.status === 'waiting' && roomState.guest) {
      // Safe host transfer
      roomState.host = { ...roomState.guest, isHost: true };
      roomState.guest = null;
    } else {
      roomState.status = 'finished';
      roomState.winnerId = roomState.guest ? roomState.guest.id : null;
      roomState.expiredReason = 'غادر صانع الغرفة التحدي.';
    }
  } else if (roomState.guest && roomState.guest.id === playerId) {
    if (roomState.status === 'waiting') {
      roomState.guest = null;
    } else {
      roomState.status = 'finished';
      roomState.winnerId = roomState.host.id;
      roomState.expiredReason = 'غادر الخصم التحدي.';
    }
  }

  saveRoomInternal(roomState, rawQuestions);
  return { room: sanitizeRoomForClient(roomState, rawQuestions) };
}

/**
 * Connection heartbeat ping
 */
export function registerHeartbeat(roomId: string, playerId: string): ServerActionResponse {
  const room = getRoom(roomId, playerId);
  return { room };
}
