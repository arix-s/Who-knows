import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RoomState, Player, ConnectionStatus, ServerActionResponse } from '../types/game';

// Check if optional Supabase environment variables are provided
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const BROADCAST_CHANNEL_NAME = 'millionaire_1v1_game_state';
const SESSION_KEY = 'millionaire_active_session';

export interface ActiveSession {
  roomId: string;
  playerId: string;
  joinedAt: number;
}

class RealtimeService {
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<(room: RoomState) => void> = new Set();
  private connectionStatusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private activeRoomId: string | null = null;
  private activePlayerId: string | null = null;
  private sseEventSource: EventSource | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentStatus: ConnectionStatus = 'connected';

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.id && event.data.id === this.activeRoomId) {
          this.notifyListeners(event.data);
        }
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('millionaire_room_') && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed && parsed.id === this.activeRoomId) {
              this.notifyListeners(parsed);
            }
          } catch {
            // Ignore
          }
        }
      });
    }
  }

  public getActiveSession(): ActiveSession | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.roomId && parsed.playerId) {
        return parsed;
      }
    } catch {
      // Ignore
    }
    return null;
  }

  public setActiveSession(roomId: string, playerId: string) {
    if (typeof window === 'undefined') return;
    const session: ActiveSession = { roomId, playerId, joinedAt: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  public clearActiveSession() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SESSION_KEY);
  }

  private setConnectionStatus(status: ConnectionStatus) {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.connectionStatusListeners.forEach((fn) => fn(status));
    }
  }

  public subscribeConnectionStatus(callback: (status: ConnectionStatus) => void): () => void {
    this.connectionStatusListeners.add(callback);
    callback(this.currentStatus);
    return () => this.connectionStatusListeners.delete(callback);
  }

  public subscribeToRoom(
    roomId: string,
    playerId: string,
    callback: (room: RoomState) => void
  ): () => void {
    this.activeRoomId = roomId.toUpperCase().trim();
    this.activePlayerId = playerId;
    this.listeners.add(callback);

    this.setActiveSession(this.activeRoomId, playerId);

    // Initial fetch
    this.fetchRoomState(this.activeRoomId, playerId).then((room) => {
      if (room) callback(room);
    });

    // Setup SSE connection
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      this.closeSSE();
      try {
        const url = `/api/rooms/${encodeURIComponent(this.activeRoomId)}/stream?playerId=${encodeURIComponent(playerId)}`;
        this.sseEventSource = new EventSource(url);
        this.sseEventSource.onmessage = (event) => {
          try {
            const roomData = JSON.parse(event.data);
            if (roomData && roomData.id) {
              this.setConnectionStatus('connected');
              this.broadcastLocally(roomData);
              this.notifyListeners(roomData);
            }
          } catch {
            // Ignore
          }
        };

        this.sseEventSource.onerror = () => {
          this.setConnectionStatus('reconnecting');
        };
      } catch {
        // Fallback
      }
    }

    // High-frequency polling (750ms) as reliable fallback
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => {
        if (this.activeRoomId && this.activePlayerId) {
          this.fetchRoomState(this.activeRoomId, this.activePlayerId).then((room) => {
            if (room) {
              this.setConnectionStatus('connected');
              this.broadcastLocally(room);
              this.notifyListeners(room);
            }
          });
        }
      }, 750);
    }

    // Heartbeat ping every 2.5 seconds
    if (!this.heartbeatInterval) {
      this.heartbeatInterval = setInterval(() => {
        if (this.activeRoomId && this.activePlayerId) {
          this.sendHeartbeat(this.activeRoomId, this.activePlayerId);
        }
      }, 2500);
    }

    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.activeRoomId = null;
        this.activePlayerId = null;
        this.closeSSE();
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
        }
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
          this.heartbeatInterval = null;
        }
      }
    };
  }

  private closeSSE() {
    if (this.sseEventSource) {
      this.sseEventSource.close();
      this.sseEventSource = null;
    }
  }

  private notifyListeners(room: RoomState) {
    this.listeners.forEach((fn) => fn(room));
  }

  private broadcastLocally(room: RoomState) {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(room);
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`millionaire_room_${room.id}`, JSON.stringify(room));
      } catch {
        // Ignore quota
      }
    }
  }

  private async sendHeartbeat(roomId: string, playerId: string) {
    try {
      await fetch(`/api/rooms/${encodeURIComponent(roomId)}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
    } catch {
      this.setConnectionStatus('weak');
    }
  }

  public async fetchRoomState(roomId: string, playerId?: string): Promise<RoomState | null> {
    try {
      const url = `/api/rooms/${encodeURIComponent(roomId)}${playerId ? `?playerId=${encodeURIComponent(playerId)}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) {
        this.setConnectionStatus('reconnecting');
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(`millionaire_room_${roomId.toUpperCase().trim()}`);
          if (stored) return JSON.parse(stored);
        }
        return null;
      }
      const data = await res.json();
      return data.room || null;
    } catch {
      this.setConnectionStatus('disconnected');
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`millionaire_room_${roomId.toUpperCase().trim()}`);
        if (stored) {
          try { return JSON.parse(stored); } catch { return null; }
        }
      }
      return null;
    }
  }

  public async createRoom(
    hostPlayer: { id: string; name: string; avatar: string },
    category: string,
    questionCount: number,
    secondsPerQuestion: number
  ): Promise<ServerActionResponse> {
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostPlayer, category, questionCount, secondsPerQuestion })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'تعذر الاتصال بالخادم' }));
        return { room: null, error: err.error || 'حدث خطأ، حاول مرة أخرى' };
      }
      const data: ServerActionResponse = await res.json();
      if (data.room) {
        this.setActiveSession(data.room.id, hostPlayer.id);
        this.broadcastLocally(data.room);
      }
      return data;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'تعذر الاتصال بالخادم';
      return { room: null, error: msg };
    }
  }

  public async joinRoom(
    roomId: string,
    guestPlayer: { id: string; name: string; avatar: string }
  ): Promise<ServerActionResponse> {
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, guestPlayer })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'تعذر الاتصال بالخادم' }));
        return { room: null, error: err.error || 'تعذر الانضمام للغرفة' };
      }
      const data: ServerActionResponse = await res.json();
      if (data.room) {
        this.setActiveSession(data.room.id, guestPlayer.id);
        this.broadcastLocally(data.room);
      }
      return data;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'فقدنا الاتصال، جاري إعادة الاتصال...';
      return { room: null, error: msg };
    }
  }

  public async toggleReady(roomId: string, playerId: string): Promise<ServerActionResponse> {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/ready`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      const data: ServerActionResponse = await res.json();
      if (data.room) {
        this.broadcastLocally(data.room);
        this.notifyListeners(data.room);
      }
      return data;
    } catch {
      return { room: null, error: 'حدث خطأ أثناء إرسال الجاهزية' };
    }
  }

  public async submitAnswer(
    roomId: string,
    playerId: string,
    questionIndex: number,
    option: string
  ): Promise<ServerActionResponse> {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, questionIndex, option })
      });
      const data: ServerActionResponse = await res.json();
      if (data.room) {
        this.broadcastLocally(data.room);
        this.notifyListeners(data.room);
      }
      return data;
    } catch {
      return { room: null, error: 'حدث خطأ أثناء إرسال الإجابة' };
    }
  }

  public async useLifeline(
    roomId: string,
    playerId: string,
    lifelineType: 'fiftyFifty' | 'audience' | 'freeze'
  ): Promise<{ response: ServerActionResponse; payload?: unknown }> {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/lifeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, lifelineType })
      });
      const data = await res.json();
      if (data.room) {
        this.broadcastLocally(data.room);
        this.notifyListeners(data.room);
      }
      return { response: { room: data.room }, payload: data.payload };
    } catch {
      return { response: { room: null, error: 'تعذر تفعيل وسيلة المساعدة' } };
    }
  }

  public async requestRematch(roomId: string, playerId: string): Promise<ServerActionResponse> {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/rematch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      const data: ServerActionResponse = await res.json();
      if (data.room) {
        this.broadcastLocally(data.room);
        this.notifyListeners(data.room);
      }
      return data;
    } catch {
      return { room: null, error: 'تعذر طلب إعادة المباراة' };
    }
  }

  public async leaveRoom(roomId: string, playerId: string): Promise<ServerActionResponse> {
    this.clearActiveSession();
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      const data: ServerActionResponse = await res.json();
      return data;
    } catch {
      return { room: null };
    }
  }

  public async joinMatchmaking(
    player: { id: string; name: string; avatar: string },
    category: string = 'all'
  ): Promise<{ status: 'searching' | 'matched'; room?: RoomState; error?: string }> {
    try {
      const res = await fetch('/api/matchmaking/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player, category })
      });
      if (!res.ok) {
        return { status: 'searching', error: 'تعذر الاتصال بخادم التوافق' };
      }
      return await res.json();
    } catch {
      return { status: 'searching', error: 'حدث خطأ في الاتصال' };
    }
  }

  public async pingMatchmaking(
    playerId: string
  ): Promise<{ status: 'searching' | 'matched' | 'timeout' | 'not_in_queue'; room?: RoomState }> {
    try {
      const res = await fetch('/api/matchmaking/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      if (!res.ok) return { status: 'searching' };
      return await res.json();
    } catch {
      return { status: 'searching' };
    }
  }

  public async cancelMatchmaking(playerId: string): Promise<boolean> {
    try {
      await fetch('/api/matchmaking/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      });
      return true;
    } catch {
      return false;
    }
  }
}

export const realtimeService = new RealtimeService();
