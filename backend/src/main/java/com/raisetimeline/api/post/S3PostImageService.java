package com.raisetimeline.api.post;

import com.raisetimeline.api.exception.BadRequestException;
import com.raisetimeline.api.storage.S3StorageService;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * 投稿画像の検証とキー生成。実際のS3操作は {@link S3StorageService} に委譲する。
 *
 * <p>DBに保存するのは公開URLではなく object key（例: posts/xxxx.jpg）。
 * 表示のたびに期限付きのpresigned URLを発行するため、バケットを公開する必要がない。
 */
@Service
public class S3PostImageService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "image/jpeg", "image/png", "image/gif"
    );
    private static final Map<String, String> CONTENT_TYPE_TO_EXT = Map.of(
            "image/jpeg", "jpg",
            "image/png", "png",
            "image/gif", "gif"
    );
    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final String KEY_PREFIX = "posts/";
    private static final String ERROR_MESSAGE = "画像はJPEG・PNG・GIF形式、5MB以内でアップロードしてください";

    private final S3StorageService s3StorageService;

    public S3PostImageService(S3StorageService s3StorageService) {
        this.s3StorageService = s3StorageService;
    }

    /**
     * 画像をS3に保存し、object key を返す。
     *
     * @return DBに保存する object key（例: posts/xxxx.jpg）
     */
    public String store(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new BadRequestException(ERROR_MESSAGE);
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException(ERROR_MESSAGE);
        }

        String key = KEY_PREFIX + UUID.randomUUID() + "." + CONTENT_TYPE_TO_EXT.get(contentType);
        s3StorageService.put(key, file);
        return key;
    }

    /** object key を指定して削除する。 */
    public void delete(String key) {
        s3StorageService.delete(key);
    }
}
