package com.raisetimeline.api.post;

import com.raisetimeline.api.exception.BadRequestException;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

/**
 * 投稿画像のS3保存。
 *
 * <p>DBに保存するのは公開URLではなく <b>object key</b>（例: posts/xxxx.jpg）。
 * 表示のたびに期限付きのpresigned URLを発行するため、バケットを公開する必要がない。
 *
 * <p>以前は公開URLを組み立てて保存し、削除時にURLから key を逆算していたが、
 * URLの形式が変わると key を取り出せず削除が黙って失敗するため、key を直接持つ方式に変更した。
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

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${app.s3.bucket-name}")
    private String bucketName;

    @Value("${app.s3.presigned-url-expiration-minutes:60}")
    private long presignedUrlExpirationMinutes;

    public S3PostImageService(S3Client s3Client, S3Presigner s3Presigner) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
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

        String ext = CONTENT_TYPE_TO_EXT.get(contentType);
        String key = KEY_PREFIX + UUID.randomUUID() + "." + ext;

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .contentType(contentType)
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize())
            );
        } catch (IOException e) {
            throw new BadRequestException("画像の保存に失敗しました");
        } catch (Exception e) {
            throw new BadRequestException("画像のアップロードに失敗しました。AWS設定を確認してください: " + e.getMessage());
        }

        return key;
    }

    /**
     * 期限付きの参照URLを発行する。バケットを公開せずに画像を表示するために使う。
     *
     * @param key DBに保存されている object key
     */
    public String presignedUrl(String key) {
        if (key == null) {
            return null;
        }
        GetObjectPresignRequest request = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(presignedUrlExpirationMinutes))
                .getObjectRequest(GetObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .build())
                .build();
        return s3Presigner.presignGetObject(request).url().toString();
    }

    /**
     * object key を指定して削除する。
     *
     * @param key DBに保存されている object key
     */
    public void delete(String key) {
        if (key == null || key.isBlank()) {
            return;
        }
        try {
            s3Client.deleteObject(
                    DeleteObjectRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .build()
            );
        } catch (Exception e) {
            // S3削除失敗は処理を継続
        }
    }
}
