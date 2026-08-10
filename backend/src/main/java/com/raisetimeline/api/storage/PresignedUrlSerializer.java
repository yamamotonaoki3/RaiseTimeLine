package com.raisetimeline.api.storage;

import tools.jackson.core.JsonGenerator;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.ValueSerializer;

/**
 * DTOのフィールドに保持している object key を、JSONへの出力時に presigned URL へ変換する。
 *
 * <p>投稿画像・アバターとも同じバケットに {@code posts/xxx} / {@code avatars/xxx} という
 * key で保存されており、{@link S3StorageService#presignedUrl} はどちらのkeyでも扱える。
 * そのため用途に関わらずこのシリアライザ1つで済む。
 *
 * <p>アノテーションを付けるだけで変換される。呼び出し側（Service層）が
 * presigned URL の発行を個別に呼ぶ必要はなく、DBから読んだ生のkeyをそのまま
 * DTOに詰めればよい。変換を書き忘れる余地がないのが狙い。
 *
 * <pre>{@code
 * public record UserProfileResponse(
 *         Long id,
 *         String displayName,
 *         @JsonSerialize(using = PresignedUrlSerializer.class) String avatarUrl,
 *         ...
 * ) {}
 * }</pre>
 *
 * <p>Jackson 3（tools.jackson）の {@code ValueSerializer} は、null値に対しては
 * フレームワーク側が呼び出し前に処理するため、このクラスは非nullのkeyしか受け取らない。
 */
public class PresignedUrlSerializer extends ValueSerializer<String> {

    private final S3StorageService s3StorageService;

    public PresignedUrlSerializer(S3StorageService s3StorageService) {
        this.s3StorageService = s3StorageService;
    }

    @Override
    public void serialize(String key, JsonGenerator gen, SerializationContext ctxt) {
        gen.writeString(s3StorageService.presignedUrl(key));
    }
}
