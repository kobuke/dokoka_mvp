"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MapPin, Check } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Checkbox } from "../../../components/ui/checkbox";
import { Label } from "../../../components/ui/label";
import {
  generateId,
  generateRandomColor,
  RoomProvider,
  useRoom,
  type Room,
  type User,
} from "../../../lib/room-context";
import { supabase } from "../../../lib/supabase";
import dynamic from "next/dynamic";
import { RoomHeader } from "../../../components/room-header";

const MapView = dynamic(
  () => import("../../../components/map-view").then((mod) => mod.MapView),
  { ssr: false }
);

const COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EC4899", // pink
];

function RoomContent({
  roomId,
  duration,
}: {
  roomId: string;
  duration: string;
}) {
  const router = useRouter();
  const { setRoom, setCurrentUser, room, currentUser, isRoomExpired } =
    useRoom();
  const [nickname, setNickname] = useState("");
  const [selectedColor, setSelectedColor] = useState(() =>
    generateRandomColor()
  );
  const [agreed, setAgreed] = useState(false);
  const [entered, setEntered] = useState(false);

  // Initialize room and check persistence
  useEffect(() => {
    if (!room) {
      const durationHours = parseInt(duration) || 3;
      const newRoom: Room = {
        id: roomId,
        createdAt: Date.now(),
        expiresAt: Date.now() + durationHours * 60 * 60 * 1000,
        durationHours,
      };
      setRoom(newRoom);
    }

    // Check persistence
    const stored = localStorage.getItem(`dokoka_user_${roomId}`);
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setCurrentUser(userData);
        setNickname(userData.nickname);
        setSelectedColor(userData.color);
        setEntered(true);
        setAgreed(true);
      } catch (e) {
        console.error("Failed to restore", e);
      }
    }
  }, [roomId, duration, room, setRoom, setCurrentUser]);

  // Check for expiration
  useEffect(() => {
    if (entered && isRoomExpired()) {
      router.push(`/room/${roomId}/ended`);
    }

    const interval = setInterval(() => {
      if (entered && isRoomExpired()) {
        router.push(`/room/${roomId}/ended`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [entered, isRoomExpired, roomId, router]);

  const handleEnter = async () => {
    if (!nickname.trim() || !agreed) return;

    // Check if user with same nickname exists in database
    let existingUser: User | null = null;
    try {
      const { data: dbUsers, error } = await supabase
        .from('room_users')
        .select('*')
        .eq('room_id', roomId)
        .eq('nickname', nickname.trim())
        .limit(1);

      if (!error && dbUsers && dbUsers.length > 0) {
        const dbUser = dbUsers[0];
        existingUser = {
          id: dbUser.id,
          nickname: dbUser.nickname,
          color: dbUser.color,
          lat: dbUser.lat,
          lng: dbUser.lng,
          status: 'active',
          lastUpdate: Date.now(),
          isOnline: true,
        };
      }
    } catch (err) {
      console.error('Error checking for existing user:', err);
    }

    const newUser: User = existingUser || {
      id: generateId(),
      nickname: nickname.trim(),
      color: selectedColor,
      lat: 35.6592, // Default to Tokyo area
      lng: 139.7009,
      status: "active",
      lastUpdate: Date.now(),
      isOnline: true,
    };

    setCurrentUser(newUser);
    setEntered(true);

    // Persist
    localStorage.setItem(`dokoka_user_${roomId}`, JSON.stringify(newUser));
  };

  if (entered && currentUser) {
    return (
      <main className="min-h-screen bg-background relative">
        <RoomHeader roomId={roomId} />
        <MapView />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950" />

      {/* Decorative blurred circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <MapPin className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">ドコカ</h1>
        <p className="text-sm text-muted-foreground mb-8">
          ルームID: {roomId.slice(0, 8)}
        </p>

        {/* Main card */}
        <div className="glass-card rounded-3xl p-8 w-full">
          <h2 className="text-lg font-semibold text-foreground mb-6 text-center">
            ルームに参加する
          </h2>

          <div className="flex flex-col gap-6">
            {/* Nickname input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="nickname" className="text-sm font-medium">
                ニックネーム
              </Label>
              <Input
                id="nickname"
                placeholder="今日の呼び名を入力"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="h-12 rounded-xl bg-background/50"
                maxLength={20}
              />
            </div>

            {/* Color selector */}
            <div className="flex flex-col gap-3">
              <Label className="text-sm font-medium">パーソナルカラー</Label>
              <div className="flex flex-wrap gap-3 justify-center">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 rounded-full transition-all duration-200 ${selectedColor === color
                      ? "ring-2 ring-offset-2 ring-primary scale-110"
                      : "hover:scale-105"
                      }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  >
                    {selectedColor === color && (
                      <Check className="w-5 h-5 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Agreement checkbox */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30">
              <Checkbox
                id="agreement"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
                className="mt-0.5"
              />
              <Label
                htmlFor="agreement"
                className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
              >
                位置情報の共有に同意します。
                <br />
                <span className="text-xs">
                  ルーム終了後、データは自動削除されます。
                </span>
              </Label>
            </div>

            {/* Enter button */}
            <Button
              onClick={handleEnter}
              disabled={!nickname.trim() || !agreed}
              className="h-14 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              入場する
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function RoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const searchParams = useSearchParams();
  const duration = searchParams.get("duration") || "3";

  return (
    <RoomProvider>
      <RoomContent roomId={roomId} duration={duration} />
    </RoomProvider>
  );
}
