"use client";

import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "./ui/dialog";
import QRCode from "react-qr-code";
import { Check, Copy } from "lucide-react";

export function RoomHeader({ roomId }: { roomId: string }) {
    const [showShare, setShowShare] = useState(false);
    const [copied, setCopied] = useState(false);

    const shareUrl = typeof window !== "undefined"
        ? `${window.location.origin}/room/${roomId}`
        : "";

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-[2000] p-4 flex justify-between messages-none pointer-events-none">
                {/* Pointer events allow clicking buttons but passing through clicks to map otherwise. 
            However, we want buttons to be clickable. Best to wrap buttons in pointer-events-auto. */}

                {/* Home Button */}
                <Link href="/" className="pointer-events-auto">
                    <Button variant="outline" size="icon" className="rounded-full bg-white/90 shadow-sm backdrop-blur">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </Button>
                </Link>

                {/* Share Button */}
                <div className="pointer-events-auto">
                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full bg-white/90 shadow-sm backdrop-blur"
                        onClick={() => setShowShare(true)}
                    >
                        <Share2 className="w-5 h-5 text-gray-700" />
                    </Button>
                </div>
            </header>

            {/* Share Modal */}
            <Dialog open={showShare} onOpenChange={setShowShare}>
                <DialogContent className="sm:max-w-md rounded-3xl mx-4 w-auto">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl font-bold">
                            ルームを共有
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-6 py-4">
                        {/* QR Code */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <QRCode
                                value={shareUrl}
                                size={160}
                                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                viewBox={`0 0 256 256`}
                            />
                        </div>

                        {/* URL */}
                        <div className="w-full flex items-center gap-2 p-3 bg-muted rounded-xl">
                            <div className="flex-1 truncate text-sm text-muted-foreground px-1">
                                {shareUrl}
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="rounded-lg h-8 w-8 shrink-0"
                                onClick={handleCopy}
                            >
                                {copied ? (
                                    <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
