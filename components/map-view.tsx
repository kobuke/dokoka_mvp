"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Navigation,
  Users,
  Bell,
  ChevronUp,
  ExternalLink,
  Zap,
  Clock,
} from "lucide-react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useRoom, type User } from "../lib/room-context";
import { useGeolocation } from "../hooks/use-geolocation";

// Map pin component
function UserPin({
  user,
  isCurrentUser = false,
  basePosition,
}: {
  user: User;
  isCurrentUser?: boolean;
  basePosition: { lat: number; lng: number };
}) {
  // Calculate position relative to base (center of map)
  const offsetX = (user.lng - basePosition.lng) * 8000;
  const offsetY = (basePosition.lat - user.lat) * 8000;

  const statusClass =
    user.status === "active"
      ? "pin-active"
      : user.status === "sleep"
        ? "pin-sleep"
        : "pin-offline";

  return (
    <div
      className={`absolute flex flex-col items-center transition-all duration-500 ${statusClass}`}
      style={{
        left: `calc(50% + ${offsetX}px)`,
        top: `calc(50% + ${offsetY}px)`,
        transform: "translate(-50%, -100%)",
      }}
    >
      {/* Name tag */}
      <div
        className={`px-2 py-1 rounded-lg text-xs font-medium text-white mb-1 shadow-lg whitespace-nowrap ${
          isCurrentUser ? "bg-primary" : ""
        }`}
        style={{ backgroundColor: isCurrentUser ? undefined : user.color }}
      >
        {isCurrentUser ? "あなた" : user.nickname}
      </div>

      {/* Pin */}
      <div className="relative">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
            isCurrentUser ? "ring-2 ring-white" : ""
          }`}
          style={{ backgroundColor: user.color }}
        >
          {isCurrentUser ? (
            <Navigation className="w-4 h-4 text-white" />
          ) : (
            <MapPin className="w-4 h-4 text-white" />
          )}
        </div>
        {/* Pulse effect for active users */}
        {user.status === "active" && (
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ backgroundColor: user.color }}
          />
        )}
      </div>
    </div>
  );
}

// Countdown timer component
function CountdownTimer() {
  const { getRemainingTime } = useRoom();
  const [timeString, setTimeString] = useState("--:--:--");

  useEffect(() => {
    const updateTime = () => {
      const remaining = getRemainingTime();
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      setTimeString(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [getRemainingTime]);

  return (
    <div className="glass-card rounded-2xl px-4 py-2 flex items-center gap-2">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-medium">あと {timeString}</span>
    </div>
  );
}

// Participant list item
function ParticipantItem({
  user,
  isCurrentUser = false,
}: {
  user: User;
  isCurrentUser?: boolean;
}) {
  const handleOpenMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${user.lat},${user.lng}`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            user.status === "sleep"
              ? "opacity-50"
              : user.status === "offline"
                ? "grayscale opacity-40"
                : ""
          }`}
          style={{ backgroundColor: user.color }}
        >
          <span className="text-white font-medium text-sm">
            {user.nickname.charAt(0)}
          </span>
        </div>
        <div>
          <p className="font-medium text-sm">
            {user.nickname}
            {isCurrentUser && (
              <span className="text-muted-foreground"> (あなた)</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {user.status === "active"
              ? "アクティブ"
              : user.status === "sleep"
                ? "スリープ"
                : "オフライン"}
          </p>
        </div>
      </div>

      {!isCurrentUser && (
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl text-xs"
          onClick={handleOpenMaps}
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          ルート
        </Button>
      )}
    </div>
  );
}

export function MapView() {
  const {
    currentUser,
    users,
    wakeLockEnabled,
    toggleWakeLock,
    sendHereNotification,
    updateUserPosition,
  } = useRoom();
  const [showParticipants, setShowParticipants] = useState(false);
  const geolocation = useGeolocation();

  // Start watching location on mount
  useEffect(() => {
    geolocation.startWatching();
    return () => geolocation.stopWatching();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update user position when geolocation changes
  useEffect(() => {
    if (geolocation.lat && geolocation.lng) {
      updateUserPosition(geolocation.lat, geolocation.lng);
    }
  }, [geolocation.lat, geolocation.lng, updateUserPosition]);

  const handleNotify = useCallback(() => {
    sendHereNotification();
    // Visual feedback
    const button = document.getElementById("notify-button");
    if (button) {
      button.classList.add("animate-pulse");
      setTimeout(() => button.classList.remove("animate-pulse"), 500);
    }
  }, [sendHereNotification]);

  const basePosition = currentUser
    ? { lat: currentUser.lat, lng: currentUser.lng }
    : { lat: 35.6592, lng: 139.7009 };

  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden">
      {/* Map container */}
      <div className="flex-1 relative bg-slate-100 dark:bg-slate-900">
        {/* Mock map background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(200, 210, 220, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(200, 210, 220, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Map tiles simulation */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/3 w-40 h-24 bg-green-200 dark:bg-green-900 rounded-lg" />
          <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-green-200 dark:bg-green-900 rounded-lg" />
          <div className="absolute top-1/2 left-1/4 w-full h-1 bg-slate-300 dark:bg-slate-700 -rotate-12" />
          <div className="absolute top-1/3 right-1/3 w-1 h-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* User pins */}
        {currentUser && (
          <UserPin
            user={currentUser}
            isCurrentUser
            basePosition={basePosition}
          />
        )}
        {users.map((user) => (
          <UserPin key={user.id} user={user} basePosition={basePosition} />
        ))}

        {/* Top bar - countdown */}
        <div className="absolute top-4 left-4 right-4 flex justify-center">
          <CountdownTimer />
        </div>
      </div>

      {/* Bottom sheet */}
      <div
        className={`glass border-t border-white/20 transition-all duration-300 ${
          showParticipants ? "h-[60vh]" : "h-auto"
        }`}
      >
        {/* Handle */}
        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className="w-full py-2 flex justify-center"
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </button>

        {/* Controls */}
        <div className="px-4 pb-4 flex flex-col gap-4">
          {/* Action buttons row */}
          <div className="flex items-center gap-3">
            {/* Wake Lock toggle */}
            <div
              className={`flex-1 glass-card rounded-2xl p-4 flex items-center justify-between transition-all ${
                wakeLockEnabled ? "glow-primary animate-glow" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap
                  className={`w-5 h-5 ${wakeLockEnabled ? "text-primary" : "text-muted-foreground"}`}
                />
                <Label htmlFor="wakelock" className="text-sm font-medium">
                  合流モード
                </Label>
              </div>
              <Switch
                id="wakelock"
                checked={wakeLockEnabled}
                onCheckedChange={toggleWakeLock}
              />
            </div>

            {/* Notify button */}
            <Button
              id="notify-button"
              onClick={handleNotify}
              className="h-14 px-6 rounded-2xl font-semibold shadow-lg"
            >
              <Bell className="w-5 h-5 mr-2" />
              今ここ!
            </Button>
          </div>

          {/* Participants toggle */}
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium text-sm">
                参加者 ({users.length + 1}人)
              </span>
            </div>
            <ChevronUp
              className={`w-5 h-5 text-muted-foreground transition-transform ${
                showParticipants ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Participants list */}
          {showParticipants && (
            <div className="flex flex-col gap-1 max-h-[40vh] overflow-y-auto">
              {currentUser && (
                <ParticipantItem user={currentUser} isCurrentUser />
              )}
              {users.map((user) => (
                <ParticipantItem key={user.id} user={user} />
              ))}
            </div>
          )}
        </div>

        {/* Safe area padding for mobile */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </div>
  );
}
