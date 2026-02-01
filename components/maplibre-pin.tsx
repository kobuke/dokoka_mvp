"use client";

import { createRoot } from "react-dom/client";
import { type User } from "../lib/room-context";
import { MapPin, Navigation } from "lucide-react";

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

    root.render(
        <div className={`relative flex flex-col items-center ${statusClass} -translate-y-full`} style={{ pointerEvents: 'none' }}>
            {/* Name tag */}
            <div
                className={`px-2 py-1 rounded-lg text-xs font-medium text-white mb-1 shadow-lg whitespace-nowrap ${isCurrentUser ? "bg-primary" : ""
                    }`}
                style={{ backgroundColor: isCurrentUser ? undefined : user.color }}
            >
                {isCurrentUser ? "あなた" : user.nickname}
            </div>

            {/* Pin */}
            <div className="relative">
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${isCurrentUser ? "ring-2 ring-white" : ""
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

    return el;
}
