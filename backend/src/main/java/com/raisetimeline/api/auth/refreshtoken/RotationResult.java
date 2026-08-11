package com.raisetimeline.api.auth.refreshtoken;

import com.raisetimeline.api.user.User;

/**
 * リフレッシュトークンのローテーション結果。
 *
 * @param user         トークンの持ち主
 * @param refreshToken クライアントに渡すリフレッシュトークン。
 *                     通常は新しく発行したもの。猶予期間内の再提示では
 *                     <b>既に発行済みの置き換え先をそのまま返す</b>（新規発行しない）
 * @param newlyIssued  このリクエストで新規発行したか。false なら冪等な再試行だった
 */
public record RotationResult(User user, String refreshToken, boolean newlyIssued) {
}
