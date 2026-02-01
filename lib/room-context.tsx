"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

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
    "#06B6D4", // cyan
    "#F97316", // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Mock users for demo
const mockUsers: User[] = [
  {
    id: "user2",
    nickname: "たけし",
    color: "#EF4444",
    lat: 35.6595,
    lng: 139.7005,
    status: "active",
    lastUpdate: Date.now(),
  },
  {
    id: "user3",
    nickname: "さくら",
    color: "#10B981",
    lat: 35.6605,
    lng: 139.699,
    status: "sleep",
    lastUpdate: Date.now() - 120000,
  },
  {
    id: "user4",
    nickname: "けんた",
    color: "#F59E0B",
    lat: 35.6585,
    lng: 139.701,
    status: "offline",
    lastUpdate: Date.now() - 600000,
  },
];

export function RoomProvider({ children }: { children: ReactNode }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);
  const [wakeLockSentinel, setWakeLockSentinel] =
    useState<WakeLockSentinel | null>(null);

  // Update user position
  const updateUserPosition = useCallback(
    (lat: number, lng: number) => {
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          lat,
          lng,
          lastUpdate: Date.now(),
          status: "active",
        });
      }
    },
    [currentUser]
  );

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

  // Send "I'm here" notification
  const sendHereNotification = useCallback(() => {
    // In a real app, this would send a push notification or update
    console.log("Sending 'I am here' notification");
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

  // Cleanup wake lock on unmount
  useEffect(() => {
    return () => {
      if (wakeLockSentinel) {
        wakeLockSentinel.release();
      }
    };
  }, [wakeLockSentinel]);

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
