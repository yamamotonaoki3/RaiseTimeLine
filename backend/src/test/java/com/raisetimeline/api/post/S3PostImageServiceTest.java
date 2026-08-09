package com.raisetimeline.api.post;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.raisetimeline.api.exception.BadRequestException;
import java.net.URI;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

/**
 * S3への実通信は行わず、key の生成・バリデーション・削除対象の指定を検証する。
 * 実際のPUT/DELETEはE2E（MinIO経由）で担保する。
 */
@ExtendWith(MockitoExtension.class)
class S3PostImageServiceTest {

    private static final String BUCKET = "test-bucket";

    @Mock
    private S3Client s3Client;
    @Mock
    private S3Presigner s3Presigner;

    private S3PostImageService service;

    @BeforeEach
    void setUp() {
        service = new S3PostImageService(s3Client, s3Presigner);
        ReflectionTestUtils.setField(service, "bucketName", BUCKET);
        ReflectionTestUtils.setField(service, "presignedUrlExpirationMinutes", 60L);
    }

    private MockMultipartFile file(String contentType, byte[] content) {
        return new MockMultipartFile("image", "test.png", contentType, content);
    }

    // --- store() のバリデーション ---

    @Test
    @DisplayName("許可されていないMIMEタイプはBadRequestExceptionになる")
    void store_rejectsDisallowedContentType() {
        MockMultipartFile textFile = file("text/plain", "hello".getBytes());

        assertThatThrownBy(() -> service.store(textFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("JPEG・PNG・GIF");

        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    @Test
    @DisplayName("5MBを超える画像はBadRequestExceptionになる")
    void store_rejectsTooLargeFile() {
        MockMultipartFile largeFile = file("image/png", new byte[5 * 1024 * 1024 + 1]);

        assertThatThrownBy(() -> service.store(largeFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("5MB");

        verify(s3Client, never()).putObject(any(PutObjectRequest.class), any(RequestBody.class));
    }

    // --- store() が返すのは公開URLではなくobject key ---

    @Test
    @DisplayName("store()はposts/プレフィックス付きのobject keyを返す（URLではない）")
    void store_returnsObjectKeyNotUrl() {
        String key = service.store(file("image/png", "dummy".getBytes()));

        assertThat(key).startsWith("posts/").endsWith(".png");
        // 公開URLを返していた頃の回帰防止
        assertThat(key).doesNotContain("http").doesNotContain("amazonaws.com");
    }

    @Test
    @DisplayName("store()はバケット・key・contentTypeを指定してputObjectする")
    void store_putsObjectWithCorrectRequest() {
        String key = service.store(file("image/jpeg", "dummy".getBytes()));

        ArgumentCaptor<PutObjectRequest> captor = ArgumentCaptor.forClass(PutObjectRequest.class);
        verify(s3Client).putObject(captor.capture(), any(RequestBody.class));

        PutObjectRequest request = captor.getValue();
        assertThat(request.bucket()).isEqualTo(BUCKET);
        assertThat(request.key()).isEqualTo(key);
        assertThat(request.contentType()).isEqualTo("image/jpeg");
    }

    // --- delete() は渡されたkeyをそのまま使う ---

    @Test
    @DisplayName("delete()は渡されたkeyをそのまま削除対象にする")
    void delete_usesGivenKeyDirectly() {
        service.delete("posts/abc.png");

        ArgumentCaptor<DeleteObjectRequest> captor = ArgumentCaptor.forClass(DeleteObjectRequest.class);
        verify(s3Client).deleteObject(captor.capture());

        assertThat(captor.getValue().bucket()).isEqualTo(BUCKET);
        // URLからkeyを逆算していた実装では、この形式のkeyを取り違えていた
        assertThat(captor.getValue().key()).isEqualTo("posts/abc.png");
    }

    @Test
    @DisplayName("keyがnullや空文字なら削除を呼ばない")
    void delete_ignoresBlankKey() {
        service.delete(null);
        service.delete("");

        verify(s3Client, never()).deleteObject(any(DeleteObjectRequest.class));
    }

    // --- presignedUrl() ---

    @Test
    @DisplayName("presignedUrl()は設定された有効期限でURLを発行する")
    void presignedUrl_signsWithConfiguredExpiration() throws Exception {
        PresignedGetObjectRequest presigned = org.mockito.Mockito.mock(PresignedGetObjectRequest.class);
        when(presigned.url()).thenReturn(
                URI.create("http://localhost:9000/test-bucket/posts/abc.png?X-Amz-Signature=x").toURL());
        when(s3Presigner.presignGetObject(any(GetObjectPresignRequest.class))).thenReturn(presigned);

        String url = service.presignedUrl("posts/abc.png");

        ArgumentCaptor<GetObjectPresignRequest> captor =
                ArgumentCaptor.forClass(GetObjectPresignRequest.class);
        verify(s3Presigner).presignGetObject(captor.capture());

        assertThat(captor.getValue().signatureDuration().toMinutes()).isEqualTo(60);
        assertThat(captor.getValue().getObjectRequest().bucket()).isEqualTo(BUCKET);
        assertThat(captor.getValue().getObjectRequest().key()).isEqualTo("posts/abc.png");
        assertThat(url).contains("X-Amz-Signature");
    }

    @Test
    @DisplayName("keyがnullならpresigned URLを発行せずnullを返す")
    void presignedUrl_returnsNullForNullKey() {
        assertThat(service.presignedUrl(null)).isNull();

        verify(s3Presigner, never()).presignGetObject(any(GetObjectPresignRequest.class));
    }
}
