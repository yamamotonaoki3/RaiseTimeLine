package com.raisetimeline.api.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.DeserializationConfig;
import tools.jackson.databind.KeyDeserializer;
import tools.jackson.databind.SerializationConfig;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.ValueSerializer;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.cfg.HandlerInstantiator;
import tools.jackson.databind.cfg.MapperConfig;
import tools.jackson.databind.introspect.Annotated;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.jsontype.TypeIdResolver;
import tools.jackson.databind.jsontype.TypeResolverBuilder;

/**
 * {@code @JsonSerialize(using = PresignedUrlSerializer.class)} を付けたフィールドが
 * 実際に presigned URL へ変換されて出力されることを、本物の {@link JsonMapper} で確認する。
 *
 * <p>本番ではSpringが {@code SpringBeanHandlerInstantiator} 経由でこのシリアライザを
 * DIするが、ここではSpringコンテナを使わず、あらかじめ組み立て済みのインスタンスを
 * 返すだけの最小限の {@link HandlerInstantiator} で代用する。
 */
class PresignedUrlSerializerTest {

    private record SampleDto(
            String name,
            @JsonSerialize(using = PresignedUrlSerializer.class) String avatarUrl
    ) {
    }

    /** 事前に組み立てたインスタンスをそのまま返すだけの HandlerInstantiator。 */
    private static HandlerInstantiator returning(ValueSerializer<?> instance) {
        return new HandlerInstantiator() {
            @Override
            public ValueDeserializer<?> deserializerInstance(
                    DeserializationConfig config, Annotated annotated, Class<?> deserClass) {
                return null;
            }

            @Override
            public KeyDeserializer keyDeserializerInstance(
                    DeserializationConfig config, Annotated annotated, Class<?> keyDeserClass) {
                return null;
            }

            @Override
            public ValueSerializer<?> serializerInstance(
                    SerializationConfig config, Annotated annotated, Class<?> serClass) {
                return instance;
            }

            @Override
            public TypeResolverBuilder<?> typeResolverBuilderInstance(
                    MapperConfig<?> config, Annotated annotated, Class<?> builderClass) {
                return null;
            }

            @Override
            public TypeIdResolver typeIdResolverInstance(
                    MapperConfig<?> config, Annotated annotated, Class<?> resolverClass) {
                return null;
            }
        };
    }

    @Test
    @DisplayName("@JsonSerializeを付けたフィールドがpresigned URLとして出力される")
    void fieldIsSerializedAsPresignedUrl() {
        S3StorageService s3StorageService = mock(S3StorageService.class);
        when(s3StorageService.presignedUrl("avatars/abc.png"))
                .thenReturn("http://localhost:9000/signed?X-Amz-Signature=xxx");

        JsonMapper mapper = JsonMapper.builder()
                .handlerInstantiator(returning(new PresignedUrlSerializer(s3StorageService)))
                .build();

        String json = mapper.writeValueAsString(new SampleDto("テスト", "avatars/abc.png"));

        assertThat(json).contains("\"avatarUrl\":\"http://localhost:9000/signed?X-Amz-Signature=xxx\"");
        verify(s3StorageService).presignedUrl("avatars/abc.png");
    }

    @Test
    @DisplayName("keyがnullなら、シリアライザを経由せずnullのまま出力される")
    void nullKeyIsNotPassedToSerializer() {
        S3StorageService s3StorageService = mock(S3StorageService.class);

        JsonMapper mapper = JsonMapper.builder()
                .handlerInstantiator(returning(new PresignedUrlSerializer(s3StorageService)))
                .build();

        String json = mapper.writeValueAsString(new SampleDto("テスト", null));

        assertThat(json).contains("\"avatarUrl\":null");
    }
}
