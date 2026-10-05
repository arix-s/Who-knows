import { LocalUserProfile } from '../utils/userProfile';
import { SocialStatePayload, SocialUser } from '../types/social';

export class SocialService {
  /**
   * Sync user profile with server
   */
  async syncUser(user: LocalUserProfile): Promise<SocialStatePayload | null> {
    try {
      const res = await fetch('/api/social/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.state;
    } catch {
      return null;
    }
  }

  /**
   * Fetch Social State
   */
  async getState(userId: string): Promise<SocialStatePayload | null> {
    try {
      const res = await fetch(`/api/social/state?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.state;
    } catch {
      return null;
    }
  }

  /**
   * Search Players
   */
  async searchPlayers(query: string, userId: string): Promise<SocialUser[]> {
    try {
      const res = await fetch(
        `/api/social/search?q=${encodeURIComponent(query)}&userId=${encodeURIComponent(userId)}`
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.results || [];
    } catch {
      return [];
    }
  }

  /**
   * Send Friend Request
   */
  async sendFriendRequest(senderId: string, target: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/social/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId, target })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'فشل إرسال الطلب' };
      return data;
    } catch {
      return { success: false, error: 'تعذر الاتصال بالخادم' };
    }
  }

  /**
   * Respond to Friend Request (accept/reject)
   */
  async respondFriendRequest(
    requestId: string,
    userId: string,
    action: 'accept' | 'reject'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/social/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, userId, action })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'تعذر معالجة الطلب' };
      return data;
    } catch {
      return { success: false, error: 'تعذر الاتصال بالخادم' };
    }
  }

  /**
   * Cancel Friend Request
   */
  async cancelFriendRequest(requestId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/social/friends/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, userId })
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, error: 'تعذر الاتصال بالخادم' };
    }
  }

  /**
   * Remove Friend
   */
  async removeFriend(userId: string, friendId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/social/friends/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, friendId })
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false, error: 'تعذر الاتصال بالخادم' };
    }
  }

  /**
   * Block Player
   */
  async blockUser(blockerId: string, targetId: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch('/api/social/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockerId, targetId })
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false };
    }
  }

  /**
   * Unblock Player
   */
  async unblockUser(blockerId: string, targetId: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch('/api/social/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockerId, targetId })
      });
      const data = await res.json();
      return data;
    } catch {
      return { success: false };
    }
  }

  /**
   * Send Challenge
   */
  async sendChallenge(
    challengerId: string,
    friendId: string,
    category: string = 'all'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch('/api/social/challenges/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengerId, friendId, category })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'تعذر إرسال التحدي' };
      return data;
    } catch {
      return { success: false, error: 'تعذر الاتصال بالخادم' };
    }
  }

  /**
   * Respond to Challenge
   */
  async respondChallenge(
    challengeId: string,
    userId: string,
    action: 'accept' | 'reject'
  ): Promise<{ success: boolean; roomId?: string; error?: string }> {
    try {
      const res = await fetch('/api/social/challenges/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, userId, action })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'تعذر الرد على التحدي' };
      return data;
    } catch {
      return { success: false, error: 'تعذر الاتصال بالخادم' };
    }
  }

  /**
   * Mark Notification Read
   */
  async markRead(userId: string, notifId: string) {
    try {
      await fetch('/api/social/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, notifId })
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Mark All Notifications Read
   */
  async markAllRead(userId: string) {
    try {
      await fetch('/api/social/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    } catch {
      // Ignore
    }
  }
}

export const socialService = new SocialService();
