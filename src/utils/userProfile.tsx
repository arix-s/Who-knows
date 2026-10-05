import React from 'react';

export interface LocalUserProfile {
  id: string;
  name: string;
  username?: string;
  avatar: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalPoints: number;
  isRegistered?: boolean;
}

export interface AvatarItem {
  id: string;
  name: string;
  badgeBg: string;
  glowColor: string;
  type: 'crown' | 'trophy' | 'zap' | 'brain' | 'shield' | 'flame' | 'star' | 'swords';
}

export const AVATARS: AvatarItem[] = [
  { id: 'av_crown', name: 'الملك الذهبي', type: 'crown', badgeBg: 'from-amber-500 via-yellow-500 to-amber-700', glowColor: 'rgba(245, 158, 11, 0.4)' },
  { id: 'av_trophy', name: 'البطل الأسطوري', type: 'trophy', badgeBg: 'from-yellow-400 via-amber-500 to-yellow-600', glowColor: 'rgba(234, 179, 8, 0.4)' },
  { id: 'av_zap', name: 'الصاعقة الذكية', type: 'zap', badgeBg: 'from-cyan-400 via-blue-500 to-indigo-600', glowColor: 'rgba(6, 182, 212, 0.4)' },
  { id: 'av_brain', name: 'العبقري الماهر', type: 'brain', badgeBg: 'from-emerald-400 via-teal-500 to-emerald-700', glowColor: 'rgba(16, 185, 129, 0.4)' },
  { id: 'av_shield', name: 'الفارس الشجاع', type: 'shield', badgeBg: 'from-indigo-500 via-purple-600 to-slate-800', glowColor: 'rgba(99, 102, 241, 0.4)' },
  { id: 'av_flame', name: 'شعلة النصر', type: 'flame', badgeBg: 'from-orange-500 via-red-500 to-rose-700', glowColor: 'rgba(249, 115, 22, 0.4)' },
  { id: 'av_star', name: 'النجم المتألق', type: 'star', badgeBg: 'from-amber-400 via-orange-400 to-yellow-600', glowColor: 'rgba(251, 191, 36, 0.4)' },
  { id: 'av_swords', name: 'المتحدي المحترف', type: 'swords', badgeBg: 'from-slate-600 via-slate-700 to-slate-900', glowColor: 'rgba(148, 163, 184, 0.4)' }
];

export function renderAvatarBadge(avatarId: string, className: string = "w-10 h-10"): React.ReactNode {
  const av = AVATARS.find(a => a.id === avatarId) || AVATARS[0];

  const renderSvgPath = () => {
    switch (av.type) {
      case 'crown':
        return <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5ZM19 19C19 19.5523 18.5523 20 18 20H6C5.44772 20 5 19.5523 5 19V18H19V19Z" fill="currentColor" />;
      case 'trophy':
        return <path d="M19 4H18V2H6V4H5C3.34 4 2 5.34 2 7V8 C2 9.66 3.34 11 5 11H6.18C6.6 12.69 7.91 14 9.61 14.72V17H8V19H16V17H14.39V14.72C16.09 14 17.4 12.69 17.82 11H19C20.66 11 22 9.66 22 8V7C22 5.34 20.66 4 19 4ZM5 9C4.45 9 4 8.55 4 8V7C4 6.45 4.45 6 5 6H6V9H5ZM20 8C20 8.55 19.55 9 19 9H18V6H19C19.55 6 20 6.45 20 7V8Z" fill="currentColor" />;
      case 'zap':
        return <path d="M11 21L13 13H7L13 3L11 11H17L11 21Z" fill="currentColor" />;
      case 'brain':
        return <path d="M12 3C10.5 3 9.1 3.6 8 4.6C6.9 3.6 5.5 3 4 3C2.3 3 1 4.3 1 6C1 6.5 1.1 7 1.4 7.5C0.5 8.4 0 9.6 0 11C0 12.8 1 14.3 2.5 15.1C2.2 15.7 2 16.3 2 17C2 19.2 3.8 21 6 21C7.2 21 8.3 20.5 9.1 19.7C10 20.5 11.2 21 12.5 21M12 3C13.5 3 14.9 3.6 16 4.6C17.1 3.6 18.5 3 20 3C21.7 3 23 4.3 23 6C23 6.5 22.9 7 22.6 7.5C23.5 8.4 24 9.6 24 11C24 12.8 23 14.3 21.5 15.1C21.8 15.7 22 16.3 22 17C22 19.2 20.2 21 18 21C16.8 21 15.7 20.5 14.9 19.7C14 20.5 12.8 21 11.5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />;
      case 'shield':
        return <path d="M12 2L4 5V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V5L12 2Z" fill="currentColor" />;
      case 'flame':
        return <path d="M12 23C16.42 23 20 19.42 20 15C20 10.5 16 7 13.5 3C12.5 7 10 9 10 12C10 13 11 14 11 15C11 17 9 18 7.5 16.5C5 18 4 20 5.5 22C6.8 22.7 8.8 23 12 23Z" fill="currentColor" />;
      case 'star':
        return <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />;
      case 'swords':
        return <path d="M14.5 17.5L19 22L22 19L17.5 14.5M14.5 17.5L17.5 14.5M14.5 17.5L12 15L6.5 20.5L3.5 17.5L9 12L6.5 9.5M17.5 14.5L15 12L20.5 6.5L17.5 3.5L12 9L9.5 6.5M6.5 9.5L2 5L5 2L9.5 6.5M6.5 9.5L9.5 6.5" stroke="currentColor" strokeWidth="2" fill="none" />;
      default:
        return <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z" fill="currentColor" />;
    }
  };

  return (
    <div
      className={`${className} rounded-2xl bg-gradient-to-br ${av.badgeBg} text-slate-950 flex items-center justify-center p-2 shrink-0 shadow-lg border border-amber-300/40 relative overflow-hidden`}
      style={{ boxShadow: `0 0 16px ${av.glowColor}` }}
    >
      <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-md text-slate-950">
        {renderSvgPath()}
      </svg>
    </div>
  );
}

const USER_KEY = 'millionaire_1v1_user_profile';
const REGISTERED_KEY = 'millionaire_1v1_user_registered_v2';

export function isUserRegistered(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(REGISTERED_KEY) === 'true';
}

export function markUserRegistered() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REGISTERED_KEY, 'true');
  }
}

export function getOrCreateUserProfile(): LocalUserProfile {
  if (typeof window === 'undefined') {
    return {
      id: 'usr_guest',
      name: 'متسابق 1',
      username: '@player_1',
      avatar: 'av_crown',
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      totalPoints: 0,
      isRegistered: true
    };
  }

  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.name && parsed.avatar) {
        if (!parsed.username) {
          parsed.username = `@player_${Math.floor(1000 + Math.random() * 9000)}`;
        }
        return parsed;
      }
    } catch {
      // Ignore
    }
  }

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const defaultUser: LocalUserProfile = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: `متسابق ${randomNum}`,
    username: `@player_${randomNum}`,
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)].id,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalPoints: 0,
    isRegistered: false
  };

  saveUserProfile(defaultUser);
  return defaultUser;
}

export function saveUserProfile(profile: LocalUserProfile): LocalUserProfile {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  }
  return profile;
}

export function updateLifetimeStats(won: boolean, isDraw: boolean, points: number) {
  const profile = getOrCreateUserProfile();
  profile.gamesPlayed += 1;
  profile.totalPoints += points;

  if (isDraw) {
    profile.draws += 1;
  } else if (won) {
    profile.wins += 1;
  } else {
    profile.losses += 1;
  }

  saveUserProfile(profile);
}
