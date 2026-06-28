package com.raisetimeline.api.post;

import com.raisetimeline.api.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

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

    @Value("${app.s3.bucket-name}")
    private String bucketName;

    @Value("${app.s3.region}")
    private String region;

    public S3PostImageService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

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

        return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + key;
    }

    public void delete(String imageUrl) {
        if (imageUrl == null || !imageUrl.contains(bucketName)) {
            return;
        }
        String marker = ".amazonaws.com/";
        String key = imageUrl.substring(imageUrl.indexOf(marker) + marker.length());
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
