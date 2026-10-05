import { Question } from '../data/questionRepository';

export type RoomLifecycle =
  | 'waiting'
  | 'ready'
  | 'countdown'
  | 'playing'
  | 'round_result'
  | 'finished'
  | 'expired';

export type ConnectionStatus =
  | 'connected'      // متصل
  | 'connecting'     // جاري الاتصال
  | 'weak'           // الاتصال ضعيف
  | 'disconnected'   // انقطع الاتصال
  | 'reconnecting'   // إعادة الاتصال...
  | 'restored';      // تم استعادة الاتصال

export interface PlayerAnswer {
  option: string;
  timeSpentSeconds: number;
  isCorrect: boolean;
  pointsEarned: number;
  answeredAt: number;
}

export interface LifelineState {
  fiftyFiftyUsed: boolean;
  audienceUsed: boolean;
  freezeUsed: boolean;
}

export interface Player {
  id: string;
  sessionToken: string;
  name: string;
  avatar: string;
  isHost: boolean;
  ready: boolean;
  score: number;
  answers: { [qIdx: number]: PlayerAnswer };
  lifelines: LifelineState;
  lastSeen: number;
  connectionStatus: ConnectionStatus;
  disconnectedAt: number | null;
}

export interface AudiencePollResult {
  questionIndex: number;
  percentages: { [option: string]: number };
}

// Client-safe version of Question (hides correctAnswer until reveal)
export interface ClientQuestion {
  id: string;
  question: string;
  options: string[];
  difficulty: 'سهل' | 'متوسط' | 'صعب';
  category: string;
  correctAnswer?: string; // Included ONLY during round_result / finished phase
}

export interface RoomState {
  id: string;
  category: string;
  questionCount: number;
  secondsPerQuestion: number;
  status: RoomLifecycle;
  currentQuestionIndex: number;
  questionStartTime: number;
  questionDurationMs: number;
  countdownStartTime: number | null; // For 3s pre-match countdown
  questions: ClientQuestion[];
  host: Player;
  guest: Player | null;
  rematchVotes: string[];
  winnerId: string | null | 'DRAW';
  removedOptionsMap?: { [key: string]: string[] };
  audiencePollMap?: { [key: string]: AudiencePollResult };
  lastUpdated: number;
  createdAt: number;
  expiredReason?: string;
}

export interface ServerActionResponse {
  room: RoomState | null;
  error?: string;
  errorCode?:
    | 'ROOM_NOT_FOUND'
    | 'ROOM_EXPIRED'
    | 'ROOM_FULL'
    | 'INVALID_CODE'
    | 'MATCH_STARTED'
    | 'MATCH_ENDED'
    | 'ACTION_INVALID'
    | 'UNAUTHORIZED'
    | 'SERVER_ERROR';
}
