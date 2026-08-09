package com.raisetimeline.api.user;

import com.raisetimeline.api.exception.BadRequestException;
import com.raisetimeline.api.storage.S3StorageService;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * アバター画像の検証とキー生成。実際のS3操作は {@link S3StorageService} に委譲する。
 *
 * <p>投稿画像と違い、許可するのは JPEG / PNG のみ（GIFは許可しない）。
 * 以前はファイル名の拡張子で判定していたが、偽装に弱いため、
 * 投稿画像と同じ MIME タイプ判定に揃えている。
 */
@Service
public class S3AvatarService {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png");
    private static final Map<String, String> CONTENT_TYPE_TO_EXT = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png"
    );
    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final String KEY_PREFIX = "avatars/";
    private static final String ERROR_MESSAGE = "画像は JPEG・PNG 形式、5MB以内でアップロードしてください";

    private final S3StorageService s3StorageService;

    public S3AvatarService(S3StorageService s3StorageService) {
        this.s3StorageService = s3StorageService;
    }

    /**
     * アバター画像をS3に保存し、object key を返す。古いアバターがあれば削除する。
     *
     * @param oldKey 差し替え前の object key（無ければ null）
     * @return DBに保存する object key（例: avatars/xxxx.png）
     */
    public String store(MultipartFile file, String oldKey) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new BadRequestException(ERROR_MESSAGE);
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException(ERROR_MESSAGE);
        }

        String key = KEY_PREFIX + UUID.randomUUID() + "." + CONTENT_TYPE_TO_EXT.get(contentType);
        s3StorageService.put(key, file);

        // 保存に成功してから古い画像を消す（先に消すと、保存に失敗したとき両方失う）
        s3StorageService.delete(oldKey);
        return key;
    }

    /** 期限付きの参照URLを発行する。keyがnullならnullを返す。 */
    public String presignedUrl(String key) {
        return s3StorageService.presignedUrl(key);
    }
}
