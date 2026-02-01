"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Share2, QrCode, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateId } from "@/lib/room-context";

export default function HomePage() {
  const router = useRouter();
  const [duration, setDuration] = useState("3");
  const [showModal, setShowModal] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCreateRoom = () => {
    const newRoomId = generateId();
    setRoomId(newRoomId);
    setShowModal(true);
  };

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/room/${roomId}?duration=${duration}`
      : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterRoom = () => {
    router.push(`/room/${roomId}?duration=${duration}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950" />

      {/* Decorative blurred circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        {/* Logo and title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg glow-primary">
            <MapPin className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
          ドコカ
        </h1>

        <p className="text-lg text-muted-foreground mb-12 text-center">
          今日だけ、はぐれない。
        </p>

        {/* Main card */}
        <div className="glass-card rounded-3xl p-8 w-full">
          <div className="flex flex-col gap-6">
            {/* Duration selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                有効期限
              </label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="h-12 rounded-xl bg-background/50">
                  <SelectValue placeholder="有効期限を選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1時間</SelectItem>
                  <SelectItem value="3">3時間</SelectItem>
                  <SelectItem value="6">6時間</SelectItem>
                  <SelectItem value="12">12時間</SelectItem>
                  <SelectItem value="24">24時間</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Create button */}
            <Button
              onClick={handleCreateRoom}
              className="h-14 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              ルームを作成
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground mt-8 text-center">
          登録不要・24時間後に完全削除
        </p>
      </div>

      {/* Share modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="glass-card border-0 rounded-3xl max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              ルームを作成しました
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            {/* QR Code placeholder */}
            <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center border-2 border-dashed border-border">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <QrCode className="w-16 h-16" />
                <span className="text-xs">QRコード</span>
              </div>
            </div>

            {/* URL */}
            <div className="w-full">
              <p className="text-xs text-muted-foreground mb-2 text-center">
                共有用URL
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted/50 rounded-xl px-4 py-3 text-sm truncate">
                  {shareUrl}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl shrink-0"
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

            {/* Actions */}
            <div className="flex flex-col w-full gap-3">
              <Button
                onClick={handleEnterRoom}
                className="h-12 rounded-xl font-semibold"
              >
                <Share2 className="w-4 h-4 mr-2" />
                このルームに入場する
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowModal(false)}
                className="h-10 rounded-xl"
              >
                閉じる
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
