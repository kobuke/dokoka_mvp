"use client";

import { createRoot } from "react-dom/client";
import { type User } from "../lib/room-context";
import { MapPin, Navigation } from "lucide-react";

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

export function createPinElement(user: User, isCurrentUser: boolean): HTMLElement {
    const el = document.createElement("div");

    // Important: maplibre markers need to handle their own pointer events if interactive triggers are needed
    el.className = "marker-container";
    el.style.width = "40px";
    el.style.height = "40px";

    const root = createRoot(el);

    const statusClass =
        user.status === "active"
            ? "pin-active"
            : user.status === "sleep"
                ? "pin-sleep"
                : "pin-offline";

    const isOffline = !user.isOnline || user.status === "offline";
    const timeAgo = isOffline ? getTimeAgoString(user.disconnectedAt) : "";

    root.render(
        <div className={`relative flex flex-col items-center ${statusClass} -translate-y-full`} style={{ pointerEvents: 'none' }}>
            {/* Name tag */}
            <div
                className={`px-2 py-1 rounded-lg text-xs font-medium text-white mb-1 shadow-lg whitespace-nowrap ${isCurrentUser ? "bg-primary" : ""
                    } ${isOffline ? "opacity-60 grayscale" : ""}`}
                style={{ backgroundColor: isCurrentUser ? undefined : user.color }}
            >
                {isCurrentUser ? "あなた" : user.nickname}
            </div>

            {/* Pin */}
            <div className="relative">
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${isCurrentUser ? "ring-2 ring-white" : ""
                        } ${isOffline ? "opacity-50 grayscale" : ""}`}
                    style={{ backgroundColor: user.color }}
                >
                    {isCurrentUser ? (
                        <Navigation className="w-4 h-4 text-white" />
                    ) : (
                        <MapPin className="w-4 h-4 text-white" />
                    )}
                </div>
                {/* Pulse effect for active users */}
                {user.status === "active" && !isOffline && (
                    <div
                        className="absolute inset-0 rounded-full animate-ping opacity-30"
                        style={{ backgroundColor: user.color }}
                    />
                )}
            </div>

            {/* Timestamp for offline users */}
            {isOffline && timeAgo && (
                <div className="mt-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-500/80 text-white shadow-sm">
                    {timeAgo}
                </div>
            )}
        </div>
    );

    return el;
}

