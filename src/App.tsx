import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from './components/AppShell';
import { FlutterAppBar } from './components/FlutterAppBar';
import { FlutterBottomNav } from './components/FlutterBottomNav';
import { ConnectionStatusBar } from './components/ConnectionStatusBar';
import { HomeAppView } from './components/HomeAppView';
import { WaitingLobbyAppView } from './components/WaitingLobbyAppView';
import { MatchScreenAppView } from './components/MatchScreenAppView';
import { WinnerStatsAppView } from './components/WinnerStatsAppView';
import { QuickMatchSearchingScreen } from './components/QuickMatchSearchingScreen';
import { CreateRoomBottomSheet } from './components/CreateRoomBottomSheet';
import { JoinRoomBottomSheet } from './components/JoinRoomBottomSheet';
import { UserProfileBottomSheet } from './components/UserProfileBottomSheet';
import { RulesBottomSheet } from './components/RulesBottomSheet';
import { FirstTimeOnboardingModal } from './components/FirstTimeOnboardingModal';
import { SocialHubBottomSheet } from './components/SocialHubBottomSheet';
import { NotificationsBottomSheet } from './components/NotificationsBottomSheet';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { ChallengeReceivedModal } from './components/ChallengeReceivedModal';
import { AppToastModal, ToastMessage } from './components/AppToastModal';
import { getOrCreateUserProfile, LocalUserProfile, saveUserProfile, isUserRegistered, markUserRegistered } from './utils/userProfile';
import { realtimeService, ActiveSession } from './services/realtimeService';
import { socialService } from './services/socialService';
import { SocialStatePayload, SocialUser, FriendChallenge } from './types/social';
import { RoomState } from './types/game';

export default function App() {
  const [userProfile, setUserProfile] = useState<LocalUserProfile>(() => getOrCreateUserProfile());
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => !isUserRegistered());
  const [activeRoom, setActiveRoom] = useState<RoomState | null>(null);

  // App-wide Custom In-Game Toast Modal state
  const [appToast, setAppToast] = useState<ToastMessage | null>(null);

  // Social & Realtime State
  const [socialState, setSocialState] = useState<SocialStatePayload>({
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
    incomingChallenges: [],
    notifications: [],
    unreadNotificationCount: 0,
    blockedUserIds: []
  });

  // Matchmaking State ("مواجهة سريعة")
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [matchedRoom, setMatchedRoom] = useState<RoomState | null>(null);
  const matchmakingPingInterval = useRef<NodeJS.Timeout | null>(null);

  // Bottom Nav Tab State
  const [activeTab, setActiveTab] = useState<'home' | 'create' | 'social' | 'profile'>('home');

  // Modals / Bottom Sheets state
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [createCategory, setCreateCategory] = useState<string>('all');
  const [joinSheetOpen, setJoinSheetOpen] = useState(false);
  const [joinCode, setJoinCode] = useState<string>('');
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [rulesSheetOpen, setRulesSheetOpen] = useState(false);
  const [socialHubOpen, setSocialHubOpen] = useState(false);
  const [notifSheetOpen, setNotifSheetOpen] = useState(false);

  // Inspect Player Profile Modal state
  const [inspectUserModal, setInspectUserModal] = useState<{ open: boolean; user: SocialUser | null }>({
    open: false,
    user: null
  });

  // REALTIME ACTIVE ROOM STREAM SUBSCRIPTION
  useEffect(() => {
    if (!activeRoom?.id) return;

    const unsubscribe = realtimeService.subscribeToRoom(
      activeRoom.id,
      userProfile.id,
      (updatedRoom) => {
        if (updatedRoom) {
          setActiveRoom(updatedRoom);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeRoom?.id, userProfile.id]);

  // Social Realtime Sync Loop (Every 2s)
  useEffect(() => {
    let isMounted = true;

    const performSocialSync = async () => {
      const state = await socialService.syncUser(userProfile);
      if (state && isMounted) {
        setSocialState(state);
      }
    };

    performSocialSync();
    const interval = setInterval(performSocialSync, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userProfile]);

  // AUTO REDIRECT CHALLENGER WHEN FRIEND ACCEPTS CHALLENGE
  useEffect(() => {
    if (!activeRoom && !isMatchmaking && socialState.activeAcceptedRoomId) {
      realtimeService.fetchRoomState(socialState.activeAcceptedRoomId, userProfile.id).then((room) => {
        if (room) {
          setActiveRoom(room);
          setSocialHubOpen(false);
          setAppToast({
            title: 'تم قبول التحدي! ⚔️',
            message: 'وافق صديقك على التحدي المباشر! جاري نقل كلاكما للمباراة...',
            type: 'success'
          });
        }
      });
    }
  }, [socialState.activeAcceptedRoomId, activeRoom, isMatchmaking, userProfile.id]);

  // Auto detect active session in localStorage or ?room=CODE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codeFromUrl = urlParams.get('room');
      if (codeFromUrl) {
        setJoinCode(codeFromUrl.toUpperCase());
        setJoinSheetOpen(true);
      }
    }
  }, []);

  // Handle Matchmaking Search
  const handleStartQuickMatch = async (category: string = 'all') => {
    setIsMatchmaking(true);
    setMatchedRoom(null);

    const initial = await realtimeService.joinMatchmaking({
      id: userProfile.id,
      name: userProfile.name,
      avatar: userProfile.avatar
    }, category);

    if (initial.status === 'matched' && initial.room) {
      handleMatchFound(initial.room);
      return;
    }

    // Start polling ping for match
    if (matchmakingPingInterval.current) clearInterval(matchmakingPingInterval.current);
    matchmakingPingInterval.current = setInterval(async () => {
      const pingRes = await realtimeService.pingMatchmaking(userProfile.id);
      if (pingRes.status === 'matched' && pingRes.room) {
        if (matchmakingPingInterval.current) clearInterval(matchmakingPingInterval.current);
        handleMatchFound(pingRes.room);
      }
    }, 1200);
  };

  const handleMatchFound = (room: RoomState) => {
    setMatchedRoom(room);
    setTimeout(() => {
      setActiveRoom(room);
      setIsMatchmaking(false);
      setMatchedRoom(null);
    }, 2500);
  };

  const handleCancelQuickMatch = () => {
    if (matchmakingPingInterval.current) {
      clearInterval(matchmakingPingInterval.current);
      matchmakingPingInterval.current = null;
    }
    realtimeService.cancelMatchmaking(userProfile.id);
    setIsMatchmaking(false);
    setMatchedRoom(null);
  };

  const handleOpenCreateRoom = (category: string = 'all') => {
    setCreateCategory(category);
    setCreateSheetOpen(true);
  };

  const handleOpenJoinRoom = () => {
    setJoinCode('');
    setJoinSheetOpen(true);
  };

  const handleLeaveRoom = () => {
    if (activeRoom) {
      realtimeService.leaveRoom(activeRoom.id, userProfile.id);
    }
    setActiveRoom(null);
    setActiveTab('home');
    if (typeof window !== 'undefined' && window.history.pushState) {
      const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.pushState({ path: cleanUrl }, '', cleanUrl);
    }
  };

  const handleRestoreSession = (session: ActiveSession) => {
    realtimeService.fetchRoomState(session.roomId, userProfile.id).then((room) => {
      if (room) {
        setActiveRoom(room);
      } else {
        realtimeService.clearActiveSession();
      }
    });
  };

  const handleSelectTab = (tab: 'home' | 'create' | 'social' | 'profile') => {
    setActiveTab(tab);
    if (tab === 'home') {
      handleLeaveRoom();
    } else if (tab === 'create') {
      handleOpenCreateRoom('all');
    } else if (tab === 'social') {
      setSocialHubOpen(true);
    } else if (tab === 'profile') {
      setProfileSheetOpen(true);
    }
  };

  const handleOnboardingComplete = (updatedProfile: LocalUserProfile) => {
    saveUserProfile(updatedProfile);
    setUserProfile(updatedProfile);
    markUserRegistered();
    setIsOnboardingOpen(false);
  };

  // Social Actions
  const handleAcceptChallenge = async (challengeId: string) => {
    const res = await socialService.respondChallenge(challengeId, userProfile.id, 'accept');
    if (res.success && res.roomId) {
      const room = await realtimeService.fetchRoomState(res.roomId, userProfile.id);
      if (room) {
        setActiveRoom(room);
        setSocialHubOpen(false);
      }
    }
  };

  const handleRejectChallenge = async (challengeId: string) => {
    await socialService.respondChallenge(challengeId, userProfile.id, 'reject');
    const newState = await socialService.getState(userProfile.id);
    if (newState) setSocialState(newState);
  };

  const activeChallenge: FriendChallenge | null =
    socialState.incomingChallenges.length > 0 ? socialState.incomingChallenges[0] : null;

  return (
    <AppShell>
      
      {/* Connection Status Bar */}
      <ConnectionStatusBar />

      {/* Top Mobile Flutter AppBar - ONLY SHOWN ON HOME / LOBBY SCREEN */}
      {!activeRoom && !isMatchmaking && (
        <FlutterAppBar
          title="مَن يعرف؟"
          userProfile={userProfile}
          unreadNotificationsCount={socialState.unreadNotificationCount}
          onOpenProfile={() => setProfileSheetOpen(true)}
          onOpenRules={() => setRulesSheetOpen(true)}
          onOpenNotifications={() => setNotifSheetOpen(true)}
          onOpenSocialHub={() => setSocialHubOpen(true)}
        />
      )}

      {/* Screen Body View */}
      <main className="flex-1 p-3.5 overflow-y-auto">
        {isMatchmaking ? (
          <QuickMatchSearchingScreen
            userProfile={userProfile}
            matchedRoom={matchedRoom}
            onCancel={handleCancelQuickMatch}
            onRetry={() => handleStartQuickMatch('all')}
          />
        ) : !activeRoom ? (
          <HomeAppView
            userProfile={userProfile}
            onStartQuickMatch={handleStartQuickMatch}
            onOpenCreateRoom={handleOpenCreateRoom}
            onOpenJoinRoom={handleOpenJoinRoom}
            onOpenProfile={() => setProfileSheetOpen(true)}
            onRestoreSession={handleRestoreSession}
          />
        ) : activeRoom.status === 'waiting' || activeRoom.status === 'countdown' ? (
          <WaitingLobbyAppView
            room={activeRoom}
            currentUserId={userProfile.id}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : activeRoom.status === 'playing' || activeRoom.status === 'round_result' ? (
          <MatchScreenAppView
            room={activeRoom}
            currentUserId={userProfile.id}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : (
          <WinnerStatsAppView
            room={activeRoom}
            currentUserId={userProfile.id}
            onGoHome={handleLeaveRoom}
          />
        )}
      </main>

      {/* Flutter Bottom Navigation Bar */}
      <FlutterBottomNav
        activeTab={activeTab}
        unreadSocialCount={socialState.incomingRequests.length}
        onSelectTab={handleSelectTab}
        onStartQuickMatch={() => handleStartQuickMatch('all')}
        inGameRoom={!!activeRoom || isMatchmaking}
      />

      {/* First Time Registration Onboarding Modal */}
      <FirstTimeOnboardingModal
        isOpen={isOnboardingOpen}
        currentProfile={userProfile}
        onComplete={handleOnboardingComplete}
      />

      {/* Custom In-Game App Toast Modal */}
      <AppToastModal
        toast={appToast}
        onClose={() => setAppToast(null)}
      />

      {/* Real-time Challenge Received Modal */}
      <ChallengeReceivedModal
        challenge={activeChallenge}
        onAccept={handleAcceptChallenge}
        onReject={handleRejectChallenge}
      />

      {/* Social Hub Bottom Sheet */}
      <SocialHubBottomSheet
        isOpen={socialHubOpen}
        currentUserId={userProfile.id}
        socialState={socialState}
        onClose={() => setSocialHubOpen(false)}
        onSearchQuery={(q) => socialService.searchPlayers(q, userProfile.id)}
        onSendFriendRequest={async (target) => {
          const res = await socialService.sendFriendRequest(userProfile.id, target);
          const st = await socialService.getState(userProfile.id);
          if (st) setSocialState(st);
          return res;
        }}
        onRespondFriendRequest={async (reqId, act) => {
          await socialService.respondFriendRequest(reqId, userProfile.id, act);
          const st = await socialService.getState(userProfile.id);
          if (st) setSocialState(st);
        }}
        onCancelFriendRequest={async (reqId) => {
          await socialService.cancelFriendRequest(reqId, userProfile.id);
          const st = await socialService.getState(userProfile.id);
          if (st) setSocialState(st);
        }}
        onRemoveFriend={async (friendId) => {
          await socialService.removeFriend(userProfile.id, friendId);
          const st = await socialService.getState(userProfile.id);
          if (st) setSocialState(st);
        }}
        onBlockUser={async (targetId) => {
          await socialService.blockUser(userProfile.id, targetId);
          const st = await socialService.getState(userProfile.id);
          if (st) setSocialState(st);
        }}
        onUnblockUser={async (targetId) => {
          await socialService.unblockUser(userProfile.id, targetId);
          const st = await socialService.getState(userProfile.id);
          if (st) setSocialState(st);
        }}
        onSendChallenge={async (friendId) => {
          const res = await socialService.sendChallenge(userProfile.id, friendId);
          if (res.success) {
            setAppToast({
              title: 'تم إرسال التحدي! ⚔️',
              message: 'تم إرسال التحدي المباشر لصديقك بنجاح! ننتظر موافقته الآن...',
              type: 'success'
            });
          } else {
            setAppToast({
              title: 'تنبيه',
              message: res.error || 'تعذر إرسال التحدي',
              type: 'error'
            });
          }
        }}
        onOpenPlayerProfile={(player) => {
          setInspectUserModal({ open: true, user: player });
        }}
      />

      {/* Notifications Bottom Sheet */}
      <NotificationsBottomSheet
        isOpen={notifSheetOpen}
        notifications={socialState.notifications}
        onClose={() => setNotifSheetOpen(false)}
        onMarkRead={async (id) => {
          await socialService.markRead(userProfile.id, id);
          const st = await socialService.getState(userProfile.id);
          if (st) setSocialState(st);
        }}
        onMarkAllRead={async () => {
          await socialService.markAllRead(userProfile.id);
          const st = await socialService.getState(userProfile.id);
          if (st) setSocialState(st);
        }}
        onOpenSocialHub={() => setSocialHubOpen(true)}
      />

      {/* Inspect Player Profile Modal */}
      {inspectUserModal.open && inspectUserModal.user && (
        <PlayerProfileModal
          isOpen={inspectUserModal.open}
          player={inspectUserModal.user}
          currentUserId={userProfile.id}
          isFriend={socialState.friends.some((f) => f.id === inspectUserModal.user?.id)}
          isPendingOutgoing={socialState.outgoingRequests.some((r) => r.receiverId === inspectUserModal.user?.id)}
          isBlocked={socialState.blockedUserIds.includes(inspectUserModal.user.id)}
          onClose={() => setInspectUserModal({ open: false, user: null })}
          onSendFriendRequest={async (target) => {
            const res = await socialService.sendFriendRequest(userProfile.id, target);
            const st = await socialService.getState(userProfile.id);
            if (st) setSocialState(st);
            if (res.success) {
              setAppToast({
                title: 'تم الإرسال',
                message: 'تم إرسال طلب الصداقة بنجاح!',
                type: 'success'
              });
            } else {
              setAppToast({
                title: 'تنبيه',
                message: res.error || 'تعذر إرسال طلب الصداقة',
                type: 'error'
              });
            }
          }}
          onSendChallenge={async (friendId) => {
            const res = await socialService.sendChallenge(userProfile.id, friendId);
            if (res.success) {
              setAppToast({
                title: 'تم إرسال التحدي! ⚔️',
                message: 'تم إرسال التحدي بنجاح لصديقك! ننتظر موافقته الآن...',
                type: 'success'
              });
            } else {
              setAppToast({
                title: 'تنبيه',
                message: res.error || 'تعذر إرسال التحدي',
                type: 'error'
              });
            }
          }}
          onRemoveFriend={async (friendId) => {
            await socialService.removeFriend(userProfile.id, friendId);
            const st = await socialService.getState(userProfile.id);
            if (st) setSocialState(st);
            setInspectUserModal({ open: false, user: null });
          }}
          onBlockUser={async (targetId) => {
            await socialService.blockUser(userProfile.id, targetId);
            const st = await socialService.getState(userProfile.id);
            if (st) setSocialState(st);
            setInspectUserModal({ open: false, user: null });
          }}
          onUnblockUser={async (targetId) => {
            await socialService.unblockUser(userProfile.id, targetId);
            const st = await socialService.getState(userProfile.id);
            if (st) setSocialState(st);
          }}
        />
      )}

      {/* Action Sheets */}
      <CreateRoomBottomSheet
        isOpen={createSheetOpen}
        initialCategory={createCategory}
        userProfile={userProfile}
        onClose={() => setCreateSheetOpen(false)}
        onRoomCreated={(room) => {
          setActiveRoom(room);
        }}
      />

      <JoinRoomBottomSheet
        isOpen={joinSheetOpen}
        initialCode={joinCode}
        userProfile={userProfile}
        onClose={() => setJoinSheetOpen(false)}
        onRoomJoined={(room) => {
          setActiveRoom(room);
        }}
      />

      <UserProfileBottomSheet
        isOpen={profileSheetOpen}
        userProfile={userProfile}
        onClose={() => setProfileSheetOpen(false)}
        onUpdateProfile={(updated) => setUserProfile(updated)}
      />

      <RulesBottomSheet
        isOpen={rulesSheetOpen}
        onClose={() => setRulesSheetOpen(false)}
      />

    </AppShell>
  );
}
