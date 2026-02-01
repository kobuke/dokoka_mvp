"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, Share2, QrCode, Copy, Check } from "lucide-react";
import { Button } from "./components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { generateId } from "./lib/room-context";

export default function HomePage() {
  const router = useRouter();
  const [duration, setDuration] = useState("3");
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const roomId = generateId();
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/room/${roomId}`;

  const handleCreateRoom = () => {
    const durationMinutes = parseInt(duration) * 60;
    const roomData = {
      id: roomId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + durationMinutes * 60000),
      users: [],
    };
    localStorage.setItem(`room_${roomId}`, JSON.stringify(roomData));
    router.push(`/room/${roomId}`);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-indigo-200/40 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-pink-200/40 to-transparent rounded-full blur-3xl animate-pulse" style={{animationDelay: "1s"}}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Hero Section */}
        <div className="text-center mb-12 max-w-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-full glass-card">
            <MapPin className="w-8 h-8 text-indigo-600" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
            ドコカ
          </h1>
          
          <p className="text-2xl md:text-3xl font-semibold text-gray-800 mb-3">
            今日だけ、はぐれない。
          </p>
          
          <p className="text-lg text-gray-600 mb-8">
            フェスや花火大会で、友達とすぐに合流できる位置共有Webアプリ。インストール不要、使い捨て。
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-md mb-6">
          <div className="glass-card rounded-3xl p-8 backdrop-blur-xl border border-white/30">
            <div className="space-y-6">
              {/* Duration Selector */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  <Clock className="w-4 h-4 inline mr-2" />
                  有効期限を選択
                </label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="w-full h-12 rounded-xl bg-white/70 border border-indigo-200 focus:ring-2 focus:ring-indigo-400 text-gray-800">
                    <SelectValue />
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

              {/* Create Button */}
              <Button
                onClick={handleCreateRoom}
                className="w-full h-12 rounded-xl text-white font-semibold text-base bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                ルームを作成
              </Button>

              {/* Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/50 text-gray-500">または</span>
                </div>
              </div>

              {/* Share Button */}
              <Button
                onClick={() => setShowModal(true)}
                variant="outline"
                className="w-full h-12 rounded-xl border-2 border-indigo-200 text-indigo-600 font-semibold hover:bg-indigo-50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                このリンクを共有
              </Button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="w-full max-w-md grid grid-cols-3 gap-3 mt-8">
          <div className="glass-card rounded-2xl p-4 text-center">
            <MapPin className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-700">リアルタイム</p>
            <p className="text-xs text-gray-600">位置共有</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <Clock className="w-6 h-6 text-pink-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-700">自動</p>
            <p className="text-xs text-gray-600">削除</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <Share2 className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-700">簡単</p>
            <p className="text-xs text-gray-600">共有</p>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="glass-card border border-white/30 rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
              ルームを共有
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                このリンクを共有してください
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-2 rounded-lg bg-white/70 border border-gray-300 text-sm text-gray-700 truncate"
                />
                <Button
                  onClick={handleCopyUrl}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                QRコード
              </label>
              <div className="bg-white/70 p-4 rounded-lg flex items-center justify-center">
                <div className="w-40 h-40 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-gray-400" />
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowModal(false)}
              className="w-full bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-semibold rounded-lg"
            >
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
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
