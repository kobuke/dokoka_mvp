"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";

export interface User {
  id: string;
  nickname: string;
  color: string;
  lat: number;
  lng: number;
  status: "active" | "sleep" | "offline";
  lastUpdate: number;
  isOnline: boolean;
  disconnectedAt?: number;
}

export interface Room {
  id: string;
  expiresAt: number;
  createdAt: number;
  durationHours: number;
}

interface RoomContextType {
  room: Room | null;
  currentUser: User | null;
  users: User[];
  wakeLockEnabled: boolean;
  setRoom: (room: Room | null) => void;
  setCurrentUser: (user: User | null) => void;
  updateUserPosition: (lat: number, lng: number) => void;
  toggleWakeLock: () => Promise<void>;
  sendHereNotification: () => void;
  getRemainingTime: () => number;
  isRoomExpired: () => boolean;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Generate random color
export function generateRandomColor(): string {
  const colors = [
    "#3B82F6", // blue
    "#EF4444", // red
    "#10B981", // green
    "#F59E0B", // amber
    "#8B5CF6", // violet
    "#EC4899", // pink
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function RoomProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const [wakeLockSentinel, setWakeLockSentinel] =
    useState<WakeLockSentinel | null>(null);

  // Supabase Channel Ref
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load user from local storage
  useEffect(() => {
    if (typeof window !== "undefined" && room) {
      const stored = localStorage.getItem(`dokoka_user_${room.id}`);
      if (stored) {
        try {
          const userData = JSON.parse(stored);
          setCurrentUser(userData);
        } catch (e) {
          console.error("Failed to restore user", e);
        }
      }
    }
  }, [room]);

  // Sync with Supabase Realtime
  useEffect(() => {
    if (!room || !currentUser) return;

    // Clean up previous channel if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`room:${room.id}`, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    // Load offline users from database and merge with presence
    const loadAllUsers = async () => {
      const newState = channel.presenceState();
      const onlineUserIds = new Set<string>();
      const activeUsers: User[] = [];

      // Get online users from Presence
      Object.keys(newState).forEach(key => {
        if (key === currentUser.id) return; // Skip self
        const presences = newState[key] as unknown as User[];
        if (presences && presences.length > 0) {
          const user = presences[0];
          activeUsers.push({ ...user, isOnline: true });
          onlineUserIds.add(user.id);
        }
      });

      // Get offline users from database
      try {
        const { data: dbUsers, error } = await supabase
          .from('room_users')
          .select('*')
          .eq('room_id', room.id)
          .eq('is_online', false);

        if (error) {
          console.error('Error loading offline users:', error);
        } else if (dbUsers) {
          dbUsers.forEach((dbUser: any) => {
            // Only add if not currently online and not self
            if (!onlineUserIds.has(dbUser.id) && dbUser.id !== currentUser.id) {
              activeUsers.push({
                id: dbUser.id,
                nickname: dbUser.nickname,
                color: dbUser.color,
                lat: dbUser.lat,
                lng: dbUser.lng,
                status: 'offline',
                lastUpdate: new Date(dbUser.last_update).getTime(),
                isOnline: false,
                disconnectedAt: dbUser.disconnected_at
                  ? new Date(dbUser.disconnected_at).getTime()
                  : undefined,
              });
            }
          });
        }
      } catch (err) {
        console.error('Failed to load offline users:', err);
      }

      setUsers(activeUsers);
    };

    channel
      .on("presence", { event: "sync" }, () => {
        loadAllUsers();
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(currentUser);
          // Initial load
          loadAllUsers();
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id, currentUser?.id]);

  // Update Presence when currentUser changes
  useEffect(() => {
    if (channelRef.current && currentUser) {
      channelRef.current.track(currentUser).catch(err => {
        console.error("Presence track error:", err);
      });
    }
  }, [currentUser]);

  // Sync currentUser to Supabase database
  useEffect(() => {
    if (!room || !currentUser) return;

    const syncToDatabase = async () => {
      try {
        const { error } = await supabase
          .from('room_users')
          .upsert({
            id: currentUser.id,
            room_id: room.id,
            nickname: currentUser.nickname,
            color: currentUser.color,
            lat: currentUser.lat,
            lng: currentUser.lng,
            is_online: true,
            last_update: new Date(currentUser.lastUpdate).toISOString(),
            disconnected_at: null,
          }, {
            onConflict: 'id'
          });

        if (error) {
          console.error('Error syncing to database:', error);
        }
      } catch (err) {
        console.error('Failed to sync to database:', err);
      }
    };

    syncToDatabase();
  }, [currentUser, room]);

  // Mark user as offline on page unload
  useEffect(() => {
    if (!currentUser || !room) return;

    const handleBeforeUnload = async () => {
      try {
        await supabase
          .from('room_users')
          .update({
            is_online: false,
            disconnected_at: new Date().toISOString(),
          })
          .eq('id', currentUser.id);
      } catch (err) {
        console.error('Failed to mark user as offline:', err);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Also mark offline on component unmount
      handleBeforeUnload();
    };
  }, [currentUser, room]);


  // Update user position
  const updateUserPosition = useCallback((lat: number, lng: number) => {
    setCurrentUser((prev) => {
      if (!prev) return null;

      const updated = {
        ...prev,
        lat,
        lng,
        lastUpdate: Date.now(),
        status: "active" as const,
        isOnline: true,
      };

      // Persist to local storage
      if (room) {
        localStorage.setItem(`dokoka_user_${room.id}`, JSON.stringify(updated));
      }

      return updated;
    });
  }, [room]);

  // Toggle wake lock
  const toggleWakeLock = useCallback(async () => {
    if (wakeLockEnabled && wakeLockSentinel) {
      await wakeLockSentinel.release();
      setWakeLockSentinel(null);
      setWakeLockEnabled(false);
    } else {
      try {
        if ("wakeLock" in navigator) {
          const sentinel = await navigator.wakeLock.request("screen");
          setWakeLockSentinel(sentinel);
          setWakeLockEnabled(true);

          sentinel.addEventListener("release", () => {
            setWakeLockEnabled(false);
            setWakeLockSentinel(null);
          });
        }
      } catch (err) {
        console.error("Wake Lock error:", err);
      }
    }
  }, [wakeLockEnabled, wakeLockSentinel]);

  // Cleanup wake lock on unmount
  useEffect(() => {
    return () => {
      if (wakeLockSentinel) {
        wakeLockSentinel.release();
      }
    };
  }, [wakeLockSentinel]);

  // Status check (local only, presence handles remote timeout implicitly if they disconnect)
  // We can add "offline" state if needed, but Presence usually handles "left" event.
  // For MVP, if they disconnect, they disappear from map.

  // Send "I'm here" notification
  const sendHereNotification = useCallback(() => {
    // In a real app, this would send a broadcast message
    console.log("Sending 'I am here' notification");
    // TODO: Implement Supabase Broadcast if needed
  }, []);

  // Get remaining time in milliseconds
  const getRemainingTime = useCallback(() => {
    if (!room) return 0;
    return Math.max(0, room.expiresAt - Date.now());
  }, [room]);

  // Check if room has expired
  const isRoomExpired = useCallback(() => {
    if (!room) return false;
    return Date.now() >= room.expiresAt;
  }, [room]);

  return (
    <RoomContext.Provider
      value={{
        room,
        currentUser,
        users,
        wakeLockEnabled,
        setRoom,
        setCurrentUser,
        updateUserPosition,
        toggleWakeLock,
        sendHereNotification,
        getRemainingTime,
        isRoomExpired,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
}
