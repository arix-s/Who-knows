export interface SocialUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalPoints: number;
  isOnline: boolean;
  lastSeen: number;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverUsername: string;
  receiverAvatar: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: number;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: number;
}

export interface FriendChallenge {
  id: string;
  challengerId: string;
  challengerName: string;
  challengerUsername: string;
  challengerAvatar: string;
  challengedId: string;
  challengedName: string;
  challengedUsername: string;
  challengedAvatar: string;
  category: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
  roomId?: string;
  createdAt: number;
  expiresAt: number;
}

export interface SocialNotification {
  id: string;
  userId: string;
  type:
    | 'friend_request_received'
    | 'friend_request_accepted'
    | 'challenge_received'
    | 'challenge_accepted'
    | 'challenge_rejected'
    | 'friend_online';
  title: string;
  message: string;
  data?: {
    requestId?: string;
    challengeId?: string;
    roomId?: string;
    senderId?: string;
    senderName?: string;
    senderUsername?: string;
  };
  read: boolean;
  createdAt: number;
}

export interface BlockEntry {
  blockerId: string;
  blockedId: string;
  createdAt: number;
}

export interface SocialStatePayload {
  friends: SocialUser[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  incomingChallenges: FriendChallenge[];
  notifications: SocialNotification[];
  unreadNotificationCount: number;
  blockedUserIds: string[];
  activeAcceptedRoomId?: string;
}
