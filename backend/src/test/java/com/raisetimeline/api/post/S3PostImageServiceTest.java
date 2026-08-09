package com.raisetimeline.api.post;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.raisetimeline.api.exception.BadRequestException;
import com.raisetimeline.api.storage.S3StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

/**
 * 投稿画像の検証とキー生成を確認する。S3への実通信は行わない。
 * 実際のPUT/DELETEはE2E（MinIO経由）で担保する。
 */
@ExtendWith(MockitoExtension.class)
class S3PostImageServiceTest {

    @Mock
    private S3StorageService s3StorageService;

    private S3PostImageService service;

    @BeforeEach
    void setUp() {
        service = new S3PostImageService(s3StorageService);
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

        verify(s3StorageService, never()).put(anyString(), any(MultipartFile.class));
    }

    @Test
    @DisplayName("5MBを超える画像はBadRequestExceptionになる")
    void store_rejectsTooLargeFile() {
        MockMultipartFile largeFile = file("image/png", new byte[5 * 1024 * 1024 + 1]);

        assertThatThrownBy(() -> service.store(largeFile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("5MB");

        verify(s3StorageService, never()).put(anyString(), any(MultipartFile.class));
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
    @DisplayName("store()はcontentTypeに応じた拡張子のkeyで保存する")
    void store_putsWithGeneratedKey() {
        String key = service.store(file("image/jpeg", "dummy".getBytes()));

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(s3StorageService).put(captor.capture(), any(MultipartFile.class));

        assertThat(captor.getValue()).isEqualTo(key).endsWith(".jpg");
    }

    // --- delete() / presignedUrl() は委譲するだけ ---

    @Test
    @DisplayName("delete()は渡されたkeyをそのまま委譲する")
    void delete_delegatesGivenKey() {
        service.delete("posts/abc.png");

        // URLからkeyを逆算していた実装では、この形式のkeyを取り違えていた
        verify(s3StorageService).delete("posts/abc.png");
    }

    @Test
    @DisplayName("presignedUrl()は委譲した結果を返す")
    void presignedUrl_delegates() {
        when(s3StorageService.presignedUrl("posts/abc.png")).thenReturn("http://localhost:9000/signed");

        assertThat(service.presignedUrl("posts/abc.png")).isEqualTo("http://localhost:9000/signed");
    }
}
