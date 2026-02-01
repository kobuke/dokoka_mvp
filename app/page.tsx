"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, QrCode, Copy, Check, Share2 } from "lucide-react";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Decorative blurred circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-300/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/30 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        {/* Logo and title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <MapPin className="w-9 h-9 text-white" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
          ドコカ
        </h1>

        <p className="text-xl text-gray-600 mb-10 text-center">
          今日だけ、はぐれない。
        </p>

        {/* Main card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 w-full shadow-xl shadow-indigo-500/10 border border-white/50">
          <div className="flex flex-col gap-6">
            {/* Duration selector */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                有効期限
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-12 rounded-xl bg-gray-50 border border-gray-200 px-4 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              >
                <option value="1">1時間</option>
                <option value="3">3時間</option>
                <option value="6">6時間</option>
                <option value="12">12時間</option>
                <option value="24">24時間</option>
              </select>
            </div>

            {/* Create button */}
            <button
              onClick={handleCreateRoom}
              className="h-14 rounded-2xl text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              ルームを作成
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-sm text-gray-500 mt-8 text-center">
          登録不要・24時間後に完全削除
        </p>
      </div>

      {/* Share modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-white/50">
            <h2 className="text-xl font-bold text-gray-900 text-center mb-6">
              ルームを作成しました
            </h2>

            <div className="flex flex-col items-center gap-6">
              {/* QR Code placeholder */}
              <div className="w-48 h-48 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <QrCode className="w-16 h-16" />
                  <span className="text-xs">QRコード</span>
                </div>
              </div>

              {/* URL */}
              <div className="w-full">
                <p className="text-xs text-gray-500 mb-2 text-center">
                  共有用URL
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-700 truncate">
                    {shareUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={handleEnterRoom}
                  className="h-12 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  このルームに入場する
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="h-10 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
