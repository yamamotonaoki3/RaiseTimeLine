package com.raisetimeline.api.config;

import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.EnvironmentVariableCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * S3クライアントの設定。
 *
 * <p>接続先を設定で切り替えられるようにしてある。
 * <ul>
 *   <li>本番: app.s3.endpoint を未設定にする。実AWSのS3を向く（従来どおりの挙動）</li>
 *   <li>ローカル: MinIO を向ける。endpoint と path-style-access の指定が必要</li>
 * </ul>
 *
 * <p>path-style-access が false のままだと、AWS SDK はバケット名をホスト名の一部として扱う
 * （https://bucket.s3.region.amazonaws.com/key）。MinIO はパス形式
 * （http://localhost:9000/bucket/key）を前提とするため、名前解決に失敗して接続できない。
 */
@Configuration
public class S3Config {

    @Value("${app.s3.region}")
    private String region;

    /** 空なら endpointOverride を指定しない（＝実AWSのS3を向く）。 */
    @Value("${app.s3.endpoint:}")
    private String endpoint;

    /** MinIO では true。実S3では false。 */
    @Value("${app.s3.path-style-access:false}")
    private boolean pathStyleAccess;

    /** 空なら環境変数から認証情報を読む（実S3向け）。 */
    @Value("${app.s3.access-key:}")
    private String accessKey;

    @Value("${app.s3.secret-key:}")
    private String secretKey;

    @Bean
    public S3Client s3Client() {
        S3ClientBuilder builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider())
                .forcePathStyle(pathStyleAccess);
        if (!endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint));
        }
        return builder.build();
    }

    /**
     * presigned URL（期限付きの参照URL）を発行するためのBean。
     * バケットを公開せずにブラウザから画像を表示するために使う。
     */
    @Bean
    public S3Presigner s3Presigner() {
        S3Presigner.Builder builder = S3Presigner.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider())
                // 発行するURLもクライアントと同じ形式にする必要がある。
                // ここを揃えないと、MinIO宛なのに仮想ホスト形式のURLが発行され、ブラウザから到達できない。
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(pathStyleAccess)
                        .build());
        if (!endpoint.isBlank()) {
            builder.endpointOverride(URI.create(endpoint));
        }
        return builder.build();
    }

    private AwsCredentialsProvider credentialsProvider() {
        if (!accessKey.isBlank() && !secretKey.isBlank()) {
            return StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKey, secretKey));
        }
        return EnvironmentVariableCredentialsProvider.create();
    }
}
