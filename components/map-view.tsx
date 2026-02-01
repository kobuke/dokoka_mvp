"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Users,
  Bell,
  ChevronUp,
  ExternalLink,
  Zap,
  Clock,
  Loader2,
  Navigation,
  Settings2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { useRoom, type User } from "../lib/room-context";
import { useGeolocation } from "../hooks/use-geolocation";
import { createPinElement } from "./maplibre-pin";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";

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

// Calculate time ago string
function getTimeAgoString(disconnectedAt?: number): string {
  if (!disconnectedAt) return "";
  const now = Date.now();
  const diffMs = now - disconnectedAt;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "今";
  if (diffMinutes < 60) return `${diffMinutes}分前`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}時間前`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}日前`;
}

// Participant list item
function ParticipantItem({
  user,
  isCurrentUser = false,
  onCenter,
}: {
  user: User;
  isCurrentUser?: boolean;
  onCenter: (lat: number, lng: number) => void;
}) {
  const handleOpenMaps = (e: React.MouseEvent) => {
    e.stopPropagation(); // Don't trigger center
    const url = `https://www.google.com/maps/dir/?api=1&destination=${user.lat},${user.lng}`;
    window.open(url, "_blank");
  };

  const isOffline = !user.isOnline || user.status === "offline";
  const timeAgo = isOffline ? getTimeAgoString(user.disconnectedAt) : "";

  return (
    <div
      className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer active:bg-muted/50"
      onClick={() => onCenter(user.lat, user.lng)}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${user.status === "sleep"
            ? "opacity-50"
            : isOffline
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
                : isOffline && timeAgo
                  ? `オフライン (${timeAgo})`
                  : "オフライン"}
          </p>
        </div>
      </div>

      {!isCurrentUser && (
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl text-xs z-10 relative" // Ensure clickability
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
  const [showActions, setShowActions] = useState(false);
  const geolocation = useGeolocation();

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ [key: string]: maplibregl.Marker }>({});

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

  // Center map on a user
  const handleCenter = useCallback((lat: number, lng: number) => {
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 18,
        speed: 1.5,
        curve: 1.5,
      });
    }
  }, []);

  // Center on current location
  const handleGoToCurrentLocation = useCallback(() => {
    if (map.current && geolocation.lat && geolocation.lng) {
      map.current.flyTo({
        center: [geolocation.lng, geolocation.lat],
        zoom: 18,
        speed: 1.5,
        curve: 1.5,
      });
    }
  }, [geolocation.lat, geolocation.lng]);

  // Initialize Map (only once)
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Default center (will be updated when geolocation is available)
    const initialCenter: [number, number] = currentUser
      ? [currentUser.lng, currentUser.lat]
      : [139.7009, 35.6592];

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: initialCenter,
      zoom: 17,
      attributionControl: false,
    });

    map.current.addControl(new maplibregl.AttributionControl(), "top-left");
    map.current.addControl(new maplibregl.NavigationControl(), "bottom-right");

  }, [currentUser]);

  // Auto-center to geolocation when it becomes available
  useEffect(() => {
    if (map.current && geolocation.lat && geolocation.lng) {
      // Only auto-center on first geolocation acquisition
      const hasMovedToLocation = sessionStorage.getItem('map_centered_to_location');
      if (!hasMovedToLocation) {
        map.current.flyTo({
          center: [geolocation.lng, geolocation.lat],
          zoom: 17,
          speed: 1.2,
        });
        sessionStorage.setItem('map_centered_to_location', 'true');
      }
    }
  }, [geolocation.lat, geolocation.lng]);

  // Update Markers
  useEffect(() => {
    if (!map.current) return;

    const allUsers = [...users];
    if (currentUser) allUsers.push(currentUser);

    // Track active IDs to remove stale markers
    const activeIds = new Set(allUsers.map(u => u.id));

    // Remove old markers
    Object.keys(markers.current).forEach(id => {
      if (!activeIds.has(id)) {
        markers.current[id].remove();
        delete markers.current[id];
      }
    });

    // Add/Update markers
    allUsers.forEach(user => {
      const isMe = currentUser?.id === user.id;

      if (markers.current[user.id]) {
        markers.current[user.id].setLngLat([user.lng, user.lat]);
      } else {
        const el = createPinElement(user, isMe);
        // Add click listener to marker via element if needed, 
        // but cleaner to just let user click the list

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([user.lng, user.lat])
          .addTo(map.current!);

        markers.current[user.id] = marker;
      }
    });

  }, [users, currentUser]);


  return (
    <div className="h-screen w-full flex flex-col relative overflow-hidden">
      {/* Map container */}
      <div className="flex-1 relative z-0" ref={mapContainer}>
        {/* Top bar - countdown */}
        <div className="absolute top-20 left-4 right-4 flex justify-center z-[500] pointer-events-none">
          <CountdownTimer />
        </div>

        {/* Current Location Button */}
        <div className="absolute bottom-4 left-4 z-[500]">
          <Button
            onClick={handleGoToCurrentLocation}
            size="icon"
            className="h-12 w-12 rounded-full bg-white hover:bg-gray-100 text-gray-700 shadow-lg"
            disabled={!geolocation.lat || !geolocation.lng}
            title="現在地へ移動"
          >
            <Navigation className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Bottom sheet - Always visible participant list */}
      <div className="glass border-t border-white/20 z-[1000] pb-safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">

        {/* Main Content: Participant List */}
        <div className="pt-2 px-2 pb-2">

          {/* Header / Actions Toggle */}
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">参加者</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {users.length + (currentUser ? 1 : 0)}人
              </span>
            </div>

            <Collapsible open={showActions} onOpenChange={setShowActions}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-muted-foreground rounded-full hover:bg-muted">
                  <Settings2 className="w-3.5 h-3.5" />
                  <span className="text-xs">設定・アクション</span>
                  <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-300 ${showActions ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          {/* Collapsible Actions Panel */}
          <Collapsible open={showActions} onOpenChange={setShowActions}>
            <CollapsibleContent className="space-y-3 px-2 py-2 mb-4 bg-muted/20 rounded-2xl animate-in slide-in-from-bottom-2 fade-in">
              {/* Action buttons row */}
              <div className="flex items-center gap-3">
                {/* Wake Lock toggle */}
                <div
                  className={`flex-1 bg-white dark:bg-slate-900 rounded-xl p-3 flex items-center justify-between transition-all border border-border/50 ${wakeLockEnabled ? "border-primary/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]" : ""
                    }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <Zap
                        className={`w-4 h-4 ${wakeLockEnabled ? "text-primary" : "text-muted-foreground"}`}
                      />
                      <Label htmlFor="wakelock" className="text-xs font-semibold cursor-pointer">
                        画面常時点灯
                      </Label>
                    </div>
                    <span className="text-[10px] text-muted-foreground pl-5.5">合流モード</span>
                  </div>
                  <Switch
                    id="wakelock"
                    checked={wakeLockEnabled}
                    onCheckedChange={toggleWakeLock}
                    className="scale-90 origin-right"
                  />
                </div>

                {/* Notify button */}
                <Button
                  id="notify-button"
                  onClick={handleNotify}
                  size="sm"
                  className="h-auto py-2.5 px-4 rounded-xl shadow-sm flex flex-col items-center gap-0.5 bg-white dark:bg-slate-900 text-foreground border border-border/50 hover:bg-muted"
                >
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold">現在地を通知</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal opacity-80">仲間に知らせる</span>
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Scrollable list */}
          <div className="max-h-[35vh] overflow-y-auto px-1 space-y-1">
            {currentUser && (
              <ParticipantItem user={currentUser} isCurrentUser onCenter={handleCenter} />
            )}
            {users.map((user) => (
              <ParticipantItem key={user.id} user={user} onCenter={handleCenter} />
            ))}
          </div>
        </div>

        {/* Safe area padding for mobile */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </div>
  );
}
