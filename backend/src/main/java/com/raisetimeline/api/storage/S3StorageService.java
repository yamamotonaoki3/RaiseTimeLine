package com.raisetimeline.api.storage;

import com.raisetimeline.api.exception.BadRequestException;
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
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
 * S3（ローカルではMinIO）への読み書きだけを担う。
 *
 * <p>「どんなファイルを許可するか」「キーをどう組み立てるか」は用途ごとに違うため、
 * ここには持たせない。投稿画像は {@code S3PostImageService}、
 * アバターは {@code S3AvatarService} がそれぞれ検証とキー生成を担当し、
 * 実際の保存・削除・URL発行はこのクラスに委譲する。
 *
 * <p>保存するのは公開URLではなく object key。表示のたびに期限付きの
 * presigned URL を発行するため、バケットを公開する必要がない。
 */
@Service
public class S3StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${app.s3.bucket-name}")
    private String bucketName;

    @Value("${app.s3.presigned-url-expiration-minutes:60}")
    private long presignedUrlExpirationMinutes;

    public S3StorageService(S3Client s3Client, S3Presigner s3Presigner) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
    }

    /** アップロードされたファイルを指定のkeyで保存する。 */
    public void put(String key, MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            put(key, in, file.getSize(), file.getContentType());
        } catch (IOException e) {
            throw new BadRequestException("画像の保存に失敗しました");
        }
    }

    /** ストリームから保存する。移行処理のようにMultipartFileを持たない場合に使う。 */
    public void put(String key, InputStream content, long contentLength, String contentType) {
        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .contentType(contentType)
                            .build(),
                    RequestBody.fromInputStream(content, contentLength)
            );
        } catch (Exception e) {
            throw new BadRequestException("画像のアップロードに失敗しました。AWS設定を確認してください: " + e.getMessage());
        }
    }

    /**
     * 期限付きの参照URLを発行する。
     *
     * @param key DBに保存されている object key。nullならnullを返す
     */
    public String presignedUrl(String key) {
        if (key == null || key.isBlank()) {
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

    /** object key を指定して削除する。削除の失敗は握りつぶして処理を継続する。 */
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
