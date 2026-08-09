package com.raisetimeline.api.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.inOrder;
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
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

/**
 * アバター画像の検証とキー生成を確認する。S3への実通信は行わない。
 */
@ExtendWith(MockitoExtension.class)
class S3AvatarServiceTest {

    @Mock
    private S3StorageService s3StorageService;

    private S3AvatarService service;

    @BeforeEach
    void setUp() {
        service = new S3AvatarService(s3StorageService);
    }

    private MockMultipartFile file(String contentType, byte[] content) {
        return new MockMultipartFile("avatar", "test.png", contentType, content);
    }

    // --- バリデーション ---

    @Test
    @DisplayName("GIFは許可しない（投稿画像とは許可形式が異なる）")
    void store_rejectsGif() {
        MockMultipartFile gif = file("image/gif", "dummy".getBytes());

        assertThatThrownBy(() -> service.store(gif, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("JPEG・PNG");

        verify(s3StorageService, never()).put(anyString(), any(MultipartFile.class));
    }

    @Test
    @DisplayName("画像以外のMIMEタイプはBadRequestExceptionになる")
    void store_rejectsDisallowedContentType() {
        MockMultipartFile textFile = file("text/plain", "hello".getBytes());

        assertThatThrownBy(() -> service.store(textFile, null))
                .isInstanceOf(BadRequestException.class);

        verify(s3StorageService, never()).put(anyString(), any(MultipartFile.class));
    }

    @Test
    @DisplayName("5MBを超える画像はBadRequestExceptionになる")
    void store_rejectsTooLargeFile() {
        MockMultipartFile largeFile = file("image/png", new byte[5 * 1024 * 1024 + 1]);

        assertThatThrownBy(() -> service.store(largeFile, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("5MB");

        verify(s3StorageService, never()).put(anyString(), any(MultipartFile.class));
    }

    // --- キー生成 ---

    @Test
    @DisplayName("store()はavatars/プレフィックス付きのobject keyを返す")
    void store_returnsObjectKeyWithAvatarsPrefix() {
        String key = service.store(file("image/png", "dummy".getBytes()), null);

        assertThat(key).startsWith("avatars/").endsWith(".png");
        // ローカル配信していた頃のパス形式に戻っていないこと
        assertThat(key).doesNotStartWith("/avatars/").doesNotContain("http");
    }

    @Test
    @DisplayName("JPEGは.jpg拡張子のkeyになる")
    void store_usesJpgExtensionForJpeg() {
        String key = service.store(file("image/jpeg", "dummy".getBytes()), null);

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(s3StorageService).put(captor.capture(), any(MultipartFile.class));

        assertThat(captor.getValue()).isEqualTo(key).endsWith(".jpg");
    }

    // --- 差し替え時の古い画像の扱い ---

    @Test
    @DisplayName("古いアバターは、新しい画像の保存に成功してから削除する")
    void store_deletesOldKeyAfterUpload() {
        service.store(file("image/png", "dummy".getBytes()), "avatars/old.png");

        // 先に削除すると、保存に失敗したとき新旧どちらも失う
        InOrder order = inOrder(s3StorageService);
        order.verify(s3StorageService).put(anyString(), any(MultipartFile.class));
        order.verify(s3StorageService).delete("avatars/old.png");
    }

    @Test
    @DisplayName("古いアバターが無い場合は削除しない")
    void store_doesNotDeleteWhenNoOldKey() {
        service.store(file("image/png", "dummy".getBytes()), null);

        // S3StorageService.delete(null) は何もしない実装だが、意図を明示するため確認する
        verify(s3StorageService).delete(null);
    }

    // --- presignedUrl() ---

    @Test
    @DisplayName("presignedUrl()は委譲した結果を返す")
    void presignedUrl_delegates() {
        when(s3StorageService.presignedUrl("avatars/abc.png")).thenReturn("http://localhost:9000/signed");

        assertThat(service.presignedUrl("avatars/abc.png")).isEqualTo("http://localhost:9000/signed");
    }
}
