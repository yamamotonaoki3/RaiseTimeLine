-- リフレッシュトークンのローテーションを「削除」から「使用済みの記録」に変える。
--
-- これまでは使ったトークンを DELETE していたため、同じトークンが再提示されても
-- 「正常な同時アクセス（複数タブ）」なのか「盗まれたトークンの再利用」なのかを
-- 区別できなかった。使用時刻と置き換え先を残すことで判定できるようにする。
-- 列の追加を1文にまとめない。PostgreSQL は複数の ADD COLUMN を1文で書けるが、
-- テストで使う H2（PostgreSQL互換モード）はこの構文を解釈できず、
-- 「本番では通るがテストだけ落ちる」状態になる。

-- 使用された時刻。NULL なら未使用。
ALTER TABLE refresh_tokens ADD COLUMN used_at TIMESTAMP NULL;

-- このトークンを使って発行された次のトークン。
-- 猶予期間内の再提示に対して、新規発行せず同じ値を返すために使う。
ALTER TABLE refresh_tokens ADD COLUMN replaced_by VARCHAR(512) NULL;

-- 再利用を検知したときに、そのユーザーの全トークンを失効させる
-- （WHERE user_id = ? での削除）ために引く。
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
