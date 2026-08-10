package com.raisetimeline.api.config;

import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import tools.jackson.databind.DeserializationConfig;
import tools.jackson.databind.KeyDeserializer;
import tools.jackson.databind.SerializationConfig;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.ValueSerializer;
import tools.jackson.databind.cfg.HandlerInstantiator;
import tools.jackson.databind.cfg.MapperConfig;
import tools.jackson.databind.introspect.Annotated;
import tools.jackson.databind.jsontype.TypeIdResolver;
import tools.jackson.databind.jsontype.TypeResolverBuilder;

/**
 * {@code @JsonSerialize(using = ...)} 等で指定したクラスを、Jacksonのデフォルトの
 * 無引数コンストラクタではなく、<b>Springのビーンとして</b>生成する。
 *
 * <p>{@link com.raisetimeline.api.storage.PresignedUrlSerializer} は
 * {@code S3StorageService} をコンストラクタで受け取るため、これが無いと
 * Jacksonがインスタンス化に失敗する。
 *
 * <p>個別のクラスを判定するのではなく、Spring管理下で生成できるものは
 * すべてSpringに任せる（{@code AutowireCapableBeanFactory#createBean} は
 * 無引数コンストラクタのクラスにも対応するため、既存の挙動を壊さない）。
 */
public class SpringBeanHandlerInstantiator extends HandlerInstantiator {

    private final AutowireCapableBeanFactory beanFactory;

    public SpringBeanHandlerInstantiator(AutowireCapableBeanFactory beanFactory) {
        this.beanFactory = beanFactory;
    }

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
        return (ValueSerializer<?>) beanFactory.createBean(serClass);
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
}
