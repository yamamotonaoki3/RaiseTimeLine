package com.raisetimeline.api.config;

import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * DTOの {@code @JsonSerialize(using = PresignedUrlSerializer.class)} が
 * S3StorageService をDIできるように、SpringのBeanFactory経由でシリアライザを
 * 生成する設定。詳細は {@link SpringBeanHandlerInstantiator} を参照。
 */
@Configuration
public class JacksonConfig {

    @Bean
    public JsonMapperBuilderCustomizer springHandlerInstantiatorCustomizer(
            AutowireCapableBeanFactory beanFactory) {
        return builder -> builder.handlerInstantiator(new SpringBeanHandlerInstantiator(beanFactory));
    }
}
