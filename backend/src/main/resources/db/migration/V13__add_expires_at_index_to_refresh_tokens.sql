-- 期限切れトークンの定期削除（RefreshTokenCleanupTask）が引く索引。
--
-- この削除は WHERE expires_at < ? で走る。索引が無いと毎回テーブル全体を走査することになり、
-- 行が増えるほど遅くなる。行が増えるからこそ削除が必要なのに、
-- 増えるほど削除が重くなるという逆行した状態になるため、索引を張る。
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);
