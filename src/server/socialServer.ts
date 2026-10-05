import fs from 'fs';
import path from 'path';
import {
  SocialUser,
  FriendRequest,
  Friendship,
  FriendChallenge,
  SocialNotification,
  BlockEntry,
  SocialStatePayload
} from '../types/social';
import { createRoom, joinRoom } from './gameServer';
import { Player } from '../types/game';

// File Persistence Path
const PERSIST_FILE = path.resolve(process.cwd(), '.social_db.json');

// In-Memory Data Stores
const usersMap = new Map<string, SocialUser>();
const friendRequestsMap = new Map<string, FriendRequest>();
const friendshipsMap = new Map<string, Friendship>();
const challengesMap = new Map<string, FriendChallenge>();
const notificationsMap = new Map<string, SocialNotification[]>();
const blocksMap = new Map<string, Set<string>>(); // blockerId -> Set of blockedIds

// Load Database from Disk
function loadDatabase() {
  try {
    if (fs.existsSync(PERSIST_FILE)) {
      const content = fs.readFileSync(PERSIST_FILE, 'utf-8');
      const data = JSON.parse(content);

      if (Array.isArray(data.users)) {
        data.users.forEach((u: SocialUser) => usersMap.set(u.id, u));
      }
      if (Array.isArray(data.friendships)) {
        data.friendships.forEach((f: Friendship) => friendshipsMap.set(f.id, f));
      }
      if (Array.isArray(data.requests)) {
        data.requests.forEach((r: FriendRequest) => friendRequestsMap.set(r.id, r));
      }
      if (Array.isArray(data.blocks)) {
        data.blocks.forEach((b: { blockerId: string; blockedId: string }) => {
          let set = blocksMap.get(b.blockerId);
          if (!set) {
            set = new Set();
            blocksMap.set(b.blockerId, set);
          }
          set.add(b.blockedId);
        });
      }
    }
  } catch (err) {
    console.error('Failed to load social database:', err);
  }
}

// Save Database to Disk
function saveDatabase() {
  try {
    const blocksArray: { blockerId: string; blockedId: string }[] = [];
    for (const [blockerId, set] of blocksMap.entries()) {
      for (const blockedId of set) {
        blocksArray.push({ blockerId, blockedId });
      }
    }

    const data = {
      users: Array.from(usersMap.values()),
      friendships: Array.from(friendshipsMap.values()),
      requests: Array.from(friendRequestsMap.values()),
      blocks: blocksArray
    };

    fs.writeFileSync(PERSIST_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save social database:', err);
  }
}

// Initialize persistence on module import
loadDatabase();

/**
 * Register or update player's social presence
 */
export function syncUserSocialProfile(user: {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  gamesPlayed?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  totalPoints?: number;
}): SocialUser {
  const now = Date.now();
  const existing = usersMap.get(user.id);

  const cleanUsername = user.username
    ? user.username.startsWith('@')
      ? user.username
      : `@${user.username}`
    : `@player_${user.id.slice(-4)}`;

  const updated: SocialUser = {
    id: user.id,
    name: user.name.trim(),
    username: cleanUsername,
    avatar: user.avatar,
    gamesPlayed: user.gamesPlayed ?? existing?.gamesPlayed ?? 0,
    wins: user.wins ?? existing?.wins ?? 0,
    losses: user.losses ?? existing?.losses ?? 0,
    draws: user.draws ?? existing?.draws ?? 0,
    totalPoints: user.totalPoints ?? existing?.totalPoints ?? 0,
    isOnline: true,
    lastSeen: now
  };

  usersMap.set(user.id, updated);
  saveDatabase();
  return updated;
}

/**
 * Heartbeat presence ping
 */
export function pingUserPresence(userId: string) {
  const user = usersMap.get(userId);
  if (user) {
    user.isOnline = true;
    user.lastSeen = Date.now();
  }
}

/**
 * Clean up offline presences (> 20 seconds without ping)
 */
function cleanupPresence() {
  const now = Date.now();
  for (const user of usersMap.values()) {
    if (now - user.lastSeen > 20000) {
      user.isOnline = false;
    }
  }
}

/**
 * Helper: Check if blocker blocked blocked
 */
export function isUserBlocked(blockerId: string, targetId: string): boolean {
  const blockedSet = blocksMap.get(blockerId);
  if (blockedSet && blockedSet.has(targetId)) return true;
  const reverseBlockedSet = blocksMap.get(targetId);
  if (reverseBlockedSet && reverseBlockedSet.has(blockerId)) return true;
  return false;
}

/**
 * Search Players by @username or display name (excluding current user & blocked users)
 */
export function searchPlayers(query: string, currentUserId: string): SocialUser[] {
  cleanupPresence();
  const q = query.trim().toLowerCase().replace(/^@/, '');
  if (!q) return [];

  const results: SocialUser[] = [];
  for (const user of usersMap.values()) {
    if (user.id === currentUserId) continue;
    if (isUserBlocked(currentUserId, user.id)) continue;

    const uName = user.name.toLowerCase();
    const uHandle = user.username.toLowerCase().replace(/^@/, '');

    if (uName.includes(q) || uHandle.includes(q)) {
      results.push(user);
    }
  }

  return results.slice(0, 15);
}

/**
 * Check if two users are already friends
 */
export function areFriends(user1Id: string, user2Id: string): boolean {
  for (const f of friendshipsMap.values()) {
    if (
      (f.user1Id === user1Id && f.user2Id === user2Id) ||
      (f.user1Id === user2Id && f.user2Id === user1Id)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Send Friend Request
 */
export function sendFriendRequest(senderId: string, targetUsernameOrId: string): { success: boolean; error?: string } {
  const sender = usersMap.get(senderId);
  if (!sender) return { success: false, error: 'المستخدم غير موجود' };

  let receiver: SocialUser | undefined;
  const cleanTarget = targetUsernameOrId.trim();

  // Find by ID or username
  for (const u of usersMap.values()) {
    if (u.id === cleanTarget || u.username.toLowerCase() === cleanTarget.toLowerCase() || u.username.toLowerCase() === `@${cleanTarget.toLowerCase()}`) {
      receiver = u;
      break;
    }
  }

  if (!receiver) {
    return { success: false, error: 'لم يتم العثور على اللاعب المطلوبة إضافة صداقته' };
  }

  if (receiver.id === senderId) {
    return { success: false, error: 'لا يمكنك إرسال طلب صداقة لنفسك' };
  }

  if (isUserBlocked(senderId, receiver.id)) {
    return { success: false, error: 'تعذر إرسال الطلب بسبب قيود الحظر' };
  }

  if (areFriends(senderId, receiver.id)) {
    return { success: false, error: 'أنتم أصدقاء بالفعل!' };
  }

  // Check pending requests
  for (const req of friendRequestsMap.values()) {
    if (req.status === 'pending') {
      if (req.senderId === senderId && req.receiverId === receiver.id) {
        return { success: false, error: 'لقد أرسلت طلب صداقة لـهذا اللاعب مسبقاً' };
      }
      if (req.senderId === receiver.id && req.receiverId === senderId) {
        // Auto accept reverse request!
        respondFriendRequest(req.id, senderId, 'accept');
        return { success: true };
      }
    }
  }

  const reqId = `fr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const friendReq: FriendRequest = {
    id: reqId,
    senderId: sender.id,
    senderName: sender.name,
    senderUsername: sender.username,
    senderAvatar: sender.avatar,
    receiverId: receiver.id,
    receiverName: receiver.name,
    receiverUsername: receiver.username,
    receiverAvatar: receiver.avatar,
    status: 'pending',
    createdAt: Date.now()
  };

  friendRequestsMap.set(reqId, friendReq);
  saveDatabase();

  // Push Notification to receiver
  addNotification(receiver.id, {
    type: 'friend_request_received',
    title: 'طلب صداقة جديد 🤝',
    message: `أرسل لك ${sender.name} (${sender.username}) طلب صداقة.`,
    data: {
      requestId: reqId,
      senderId: sender.id,
      senderName: sender.name,
      senderUsername: sender.username
    }
  });

  return { success: true };
}

/**
 * Respond to Friend Request (accept / reject)
 */
export function respondFriendRequest(requestId: string, userId: string, action: 'accept' | 'reject'): { success: boolean; error?: string } {
  const req = friendRequestsMap.get(requestId);
  if (!req || req.status !== 'pending') {
    return { success: false, error: 'طلب الصداقة غير موجود أو انتهت صلاحيته' };
  }

  if (req.receiverId !== userId) {
    return { success: false, error: 'غير مصرح لك بالرد على هذا الطلب' };
  }

  if (action === 'accept') {
    req.status = 'accepted';
    const friendshipId = `fs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    friendshipsMap.set(friendshipId, {
      id: friendshipId,
      user1Id: req.senderId,
      user2Id: req.receiverId,
      createdAt: Date.now()
    });

    saveDatabase();

    // Notify sender that request was accepted
    addNotification(req.senderId, {
      type: 'friend_request_accepted',
      title: 'تم قبول طلب الصداقة 🎉',
      message: `قام ${req.receiverName} بقبول طلب الصداقة. يمكنك الآن تحديه لمواجهة 1v1!`,
      data: {
        senderId: req.receiverId,
        senderName: req.receiverName
      }
    });
  } else {
    req.status = 'rejected';
    saveDatabase();
  }

  return { success: true };
}

/**
 * Cancel Pending Sent Request
 */
export function cancelFriendRequest(requestId: string, userId: string): { success: boolean; error?: string } {
  const req = friendRequestsMap.get(requestId);
  if (!req || req.status !== 'pending') {
    return { success: false, error: 'الطلب غير موجود' };
  }

  if (req.senderId !== userId) {
    return { success: false, error: 'غير مصرح لك بإلغاء هذا الطلب' };
  }

  req.status = 'cancelled';
  saveDatabase();
  return { success: true };
}

/**
 * Remove Friend (Unfriend)
 */
export function removeFriend(userId: string, friendId: string): { success: boolean; error?: string } {
  let foundKey: string | null = null;
  for (const [key, f] of friendshipsMap.entries()) {
    if (
      (f.user1Id === userId && f.user2Id === friendId) ||
      (f.user1Id === friendId && f.user2Id === userId)
    ) {
      foundKey = key;
      break;
    }
  }

  if (foundKey) {
    friendshipsMap.delete(foundKey);
    saveDatabase();
    return { success: true };
  }

  return { success: false, error: 'الصديق غير موجود في قائمة أصدقائك' };
}

/**
 * Block User
 */
export function blockUser(blockerId: string, targetId: string): { success: boolean } {
  if (blockerId === targetId) return { success: false };

  let set = blocksMap.get(blockerId);
  if (!set) {
    set = new Set();
    blocksMap.set(blockerId, set);
  }
  set.add(targetId);

  // Remove friendship if exists
  removeFriend(blockerId, targetId);

  // Cancel any pending requests
  for (const req of friendRequestsMap.values()) {
    if (
      (req.senderId === blockerId && req.receiverId === targetId) ||
      (req.senderId === targetId && req.receiverId === blockerId)
    ) {
      req.status = 'cancelled';
    }
  }

  // Cancel pending challenges
  for (const ch of challengesMap.values()) {
    if (
      (ch.challengerId === blockerId && ch.challengedId === targetId) ||
      (ch.challengerId === targetId && ch.challengedId === blockerId)
    ) {
      ch.status = 'cancelled';
    }
  }

  saveDatabase();
  return { success: true };
}

/**
 * Unblock User
 */
export function unblockUser(blockerId: string, targetId: string): { success: boolean } {
  const set = blocksMap.get(blockerId);
  if (set) {
    set.delete(targetId);
  }
  saveDatabase();
  return { success: true };
}

/**
 * Send 1v1 Challenge to a Friend
 */
export function sendChallenge(
  challengerId: string,
  friendId: string,
  category: string = 'all'
): { success: boolean; challenge?: FriendChallenge; error?: string } {
  const challenger = usersMap.get(challengerId);
  const friend = usersMap.get(friendId);

  if (!challenger || !friend) {
    return { success: false, error: 'بيانات التحدي غير مكتملة' };
  }

  if (!areFriends(challengerId, friendId)) {
    return { success: false, error: 'يمكنك إرسال التحديات المباشرة لأصدقائك فقط' };
  }

  if (isUserBlocked(challengerId, friendId)) {
    return { success: false, error: 'تعذر إرسال التحدي بسبب قيود الحظر' };
  }

  // Check existing pending challenges
  const now = Date.now();
  for (const ch of challengesMap.values()) {
    if (
      ch.status === 'pending' &&
      ch.challengerId === challengerId &&
      ch.challengedId === friendId &&
      ch.expiresAt > now
    ) {
      return { success: false, error: 'هناك تحدٍ قائم بالفعل أرسلته لهذا الصديق!' };
    }
  }

  const challengeId = `ch_${now}_${Math.random().toString(36).substring(2, 7)}`;
  const challenge: FriendChallenge = {
    id: challengeId,
    challengerId: challenger.id,
    challengerName: challenger.name,
    challengerUsername: challenger.username,
    challengerAvatar: challenger.avatar,
    challengedId: friend.id,
    challengedName: friend.name,
    challengedUsername: friend.username,
    challengedAvatar: friend.avatar,
    category,
    status: 'pending',
    createdAt: now,
    expiresAt: now + 45000 // 45 seconds expiration
  };

  challengesMap.set(challengeId, challenge);

  // Push notification to friend
  addNotification(friend.id, {
    type: 'challenge_received',
    title: 'تحدي جديد 1v1! ⚔️',
    message: `تحداك الصديق ${challenger.name} في مواجهة مباشرة!`,
    data: {
      challengeId,
      senderId: challenger.id,
      senderName: challenger.name,
      senderUsername: challenger.username
    }
  });

  return { success: true, challenge };
}

/**
 * Respond to Challenge (accept / reject)
 */
export function respondChallenge(
  challengeId: string,
  userId: string,
  action: 'accept' | 'reject'
): { success: boolean; roomId?: string; error?: string } {
  const ch = challengesMap.get(challengeId);
  if (!ch) {
    return { success: false, error: 'التحدي غير موجود' };
  }

  if (ch.challengedId !== userId) {
    return { success: false, error: 'غير مصرح لك بالرد على هذا التحدي' };
  }

  if (ch.status !== 'pending' || Date.now() > ch.expiresAt) {
    ch.status = 'expired';
    return { success: false, error: 'انتهت صلاحية هذا التحدي' };
  }

  if (action === 'reject') {
    ch.status = 'rejected';
    addNotification(ch.challengerId, {
      type: 'challenge_rejected',
      title: 'تم رفض التحدي ❌',
      message: `اعتذر ${ch.challengedName} عن قبول التحدي حالياً.`
    });
    return { success: true };
  }

  // ACCEPT CHALLENGE -> Create Room & Assign Both Players!
  ch.status = 'accepted';

  const hostPlayer = {
    id: ch.challengerId,
    name: ch.challengerName,
    avatar: ch.challengerAvatar
  };

  const guestPlayer = {
    id: ch.challengedId,
    name: ch.challengedName,
    avatar: ch.challengedAvatar
  };

  const createRes = createRoom(hostPlayer, ch.category, 10, 15);
  if (!createRes.room) {
    return { success: false, error: 'تعذر إنشاء غرفة التحدي' };
  }

  // Join the guest player into room.guest!
  const joinRes = joinRoom(createRes.room.id, guestPlayer);
  const finalRoom = joinRes.room || createRes.room;

  ch.roomId = finalRoom.id;

  // Add Notification to Challenger
  addNotification(ch.challengerId, {
    type: 'challenge_accepted',
    title: 'تم قبول التحدي! ⚔️',
    message: `قبل ${ch.challengedName} تحديك! جاري نقلكما للمباراة...`,
    data: {
      challengeId,
      roomId: finalRoom.id
    }
  });

  return { success: true, roomId: finalRoom.id };
}

/**
 * Cancel Challenge by Challenger
 */
export function cancelChallenge(challengeId: string, userId: string): { success: boolean; error?: string } {
  const ch = challengesMap.get(challengeId);
  if (!ch || ch.challengerId !== userId) {
    return { success: false, error: 'التحدي غير موجود' };
  }
  ch.status = 'cancelled';
  return { success: true };
}

/**
 * Add Notification
 */
export function addNotification(
  userId: string,
  notif: Omit<SocialNotification, 'id' | 'userId' | 'read' | 'createdAt'>
) {
  let list = notificationsMap.get(userId);
  if (!list) {
    list = [];
    notificationsMap.set(userId, list);
  }

  const newNotif: SocialNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    data: notif.data,
    read: false,
    createdAt: Date.now()
  };

  list.unshift(newNotif);
  if (list.length > 50) list.pop(); // keep latest 50
}

/**
 * Mark notification read
 */
export function markNotificationRead(userId: string, notifId: string) {
  const list = notificationsMap.get(userId);
  if (list) {
    const item = list.find((n) => n.id === notifId);
    if (item) item.read = true;
  }
}

/**
 * Mark all notifications read
 */
export function markAllNotificationsRead(userId: string) {
  const list = notificationsMap.get(userId);
  if (list) {
    list.forEach((n) => (n.read = true));
  }
}

/**
 * Get Full Social State for User
 */
export function getSocialStateForUser(userId: string): SocialStatePayload {
  cleanupPresence();
  pingUserPresence(userId);

  // 1. Friends list
  const friends: SocialUser[] = [];
  for (const f of friendshipsMap.values()) {
    let friendId: string | null = null;
    if (f.user1Id === userId) friendId = f.user2Id;
    else if (f.user2Id === userId) friendId = f.user1Id;

    if (friendId && !isUserBlocked(userId, friendId)) {
      const u = usersMap.get(friendId);
      if (u) friends.push(u);
    }
  }

  // 2. Friend Requests
  const incomingRequests: FriendRequest[] = [];
  const outgoingRequests: FriendRequest[] = [];

  for (const req of friendRequestsMap.values()) {
    if (req.status === 'pending') {
      if (req.receiverId === userId && !isUserBlocked(userId, req.senderId)) {
        incomingRequests.push(req);
      } else if (req.senderId === userId && !isUserBlocked(userId, req.receiverId)) {
        outgoingRequests.push(req);
      }
    }
  }

  // 3. Incoming Active Challenges
  const now = Date.now();
  const incomingChallenges: FriendChallenge[] = [];
  for (const ch of challengesMap.values()) {
    if (
      ch.challengedId === userId &&
      ch.status === 'pending' &&
      ch.expiresAt > now &&
      !isUserBlocked(userId, ch.challengerId)
    ) {
      incomingChallenges.push(ch);
    }
  }

  // 4. Check if any challenge SENT BY THIS USER was accepted in last 2 mins
  let activeAcceptedRoomId: string | undefined = undefined;
  for (const ch of challengesMap.values()) {
    if (
      ch.challengerId === userId &&
      ch.status === 'accepted' &&
      ch.roomId &&
      now - ch.createdAt < 120000
    ) {
      activeAcceptedRoomId = ch.roomId;
      break;
    }
  }

  // 5. Notifications
  const userNotifs = notificationsMap.get(userId) || [];
  const unreadCount = userNotifs.filter((n) => !n.read).length;

  // 6. Blocked Users
  const blockedSet = blocksMap.get(userId);
  const blockedUserIds = blockedSet ? Array.from(blockedSet) : [];

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    incomingChallenges,
    notifications: userNotifs,
    unreadNotificationCount: unreadCount,
    blockedUserIds,
    activeAcceptedRoomId
  };
}
