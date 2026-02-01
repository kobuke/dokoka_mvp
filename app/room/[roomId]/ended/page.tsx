"use client";

import { useRouter } from "next/navigation";
import { CheckCircle, Home, Plus } from "lucide-react";
import { Button } from "../../../../components/ui/button";

export default function RoomEndedPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950" />

      {/* Decorative blurred circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          ルームが終了しました
        </h1>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          お疲れさまでした。
          <br />
          すべての位置データは削除されました。
        </p>

        {/* Main card */}
        <div className="glass-card rounded-3xl p-8 w-full">
          <div className="flex flex-col gap-4">
            <Button
              onClick={() => router.push("/")}
              className="h-14 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5 mr-2" />
              新しいルームを作成
            </Button>

            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="h-12 rounded-xl"
            >
              <Home className="w-4 h-4 mr-2" />
              ホームに戻る
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm font-medium text-foreground mb-1">ドコカ</p>
          <p className="text-xs text-muted-foreground">
            今日だけ、はぐれない。
          </p>
        </div>
      </div>
    </main>
  );
}
