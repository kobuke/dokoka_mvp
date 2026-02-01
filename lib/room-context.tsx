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

    channel
      .on("presence", { event: "sync" }, () => {
        const newState = channel.presenceState();
        const activeUsers: User[] = [];

        Object.keys(newState).forEach(key => {
          if (key === currentUser.id) return; // Skip self
          // Each key has an array of presence objects
          const presences = newState[key] as unknown as User[];
          if (presences && presences.length > 0) {
            // Take the latest one
            activeUsers.push(presences[0]);
          }
        });

        setUsers(activeUsers);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(currentUser);
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
