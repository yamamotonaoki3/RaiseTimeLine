package com.raisetimeline.api.exception;

/**
 * 使用済みのリフレッシュトークンが、猶予期間を過ぎてから再提示されたときに投げる。
 *
 * <p>盗まれたトークンが使われた疑いがあるため、投げる側でそのユーザーの全セッションを失効させる。
 *
 * <p>{@link InvalidRefreshTokenException} を継承しているのは、<b>クライアントへの応答を
 * 通常の「トークンが無効です」と区別できないようにする</b>ため。攻撃者に「再利用を検知した」と
 * 伝えると、どのトークンが有効だったかの手がかりを与えてしまう。
 * メッセージも呼び出し側で同じものを渡す。
 */
public class RefreshTokenReuseDetectedException extends InvalidRefreshTokenException {

    public RefreshTokenReuseDetectedException(String message) {
        super(message);
    }
}
