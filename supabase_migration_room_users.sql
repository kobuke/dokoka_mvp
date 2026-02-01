-- Supabase Migration: room_users テーブル
-- オフラインユーザーの位置情報を保持するためのテーブル

-- room_usersテーブルの作成
CREATE TABLE IF NOT EXISTS room_users (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  nickname TEXT NOT NULL,
  color TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  is_online BOOLEAN DEFAULT true,
  last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  disconnected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_room_users_room_id ON room_users(room_id);
CREATE INDEX IF NOT EXISTS idx_room_users_last_update ON room_users(last_update);

-- RLSの有効化
ALTER TABLE room_users ENABLE ROW LEVEL SECURITY;

-- 誰でも読み取り可能（アノニマスアクセス）
DROP POLICY IF EXISTS "Anyone can read room_users" ON room_users;
CREATE POLICY "Anyone can read room_users"
  ON room_users FOR SELECT
  USING (true);

-- 誰でも挿入・更新可能（アノニマスアクセス）
DROP POLICY IF EXISTS "Anyone can insert room_users" ON room_users;
CREATE POLICY "Anyone can insert room_users"
  ON room_users FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update room_users" ON room_users;
CREATE POLICY "Anyone can update room_users"
  ON room_users FOR UPDATE
  USING (true);

-- 誰でも削除可能（アノニマスアクセス）
DROP POLICY IF EXISTS "Anyone can delete room_users" ON room_users;
CREATE POLICY "Anyone can delete room_users"
  ON room_users FOR DELETE
  USING (true);

-- 古いデータの自動削除関数（24時間以上経過したレコード）
CREATE OR REPLACE FUNCTION delete_old_room_users()
RETURNS void AS $$
BEGIN
  DELETE FROM room_users
  WHERE last_update < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- コメント追加（ドキュメンテーション）
COMMENT ON TABLE room_users IS 'ルーム参加者の位置情報を保持。オフラインユーザーも含む';
COMMENT ON COLUMN room_users.id IS 'ユーザーの一意ID';
COMMENT ON COLUMN room_users.room_id IS '所属するルームのID';
COMMENT ON COLUMN room_users.nickname IS 'ユーザーのニックネーム';
COMMENT ON COLUMN room_users.color IS 'ユーザーの表示色（HEX）';
COMMENT ON COLUMN room_users.lat IS '緯度';
COMMENT ON COLUMN room_users.lng IS '経度';
COMMENT ON COLUMN room_users.is_online IS 'オンライン状態（true=オンライン、false=オフライン）';
COMMENT ON COLUMN room_users.last_update IS '最終更新日時';
COMMENT ON COLUMN room_users.disconnected_at IS '切断日時';
COMMENT ON COLUMN room_users.created_at IS '作成日時';
