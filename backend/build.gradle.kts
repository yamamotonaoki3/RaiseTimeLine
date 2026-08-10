plugins {
    java
    id("org.springframework.boot") version "4.0.3"
    id("io.spring.dependency-management") version "1.1.7"
    checkstyle
}

group = "com.raisetimeline"
version = "0.0.1-SNAPSHOT"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(25)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation(platform("software.amazon.awssdk:bom:2.28.0"))
    implementation("software.amazon.awssdk:s3")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.mybatis:mybatis:3.5.19")
    implementation("org.mybatis:mybatis-spring:4.0.0")
    implementation("org.springframework.boot:spring-boot-starter-jdbc")
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")
    implementation("org.springframework.boot:spring-boot-flyway")
    implementation("org.flywaydb:flyway-core")
    implementation("org.flywaydb:flyway-database-postgresql")
    runtimeOnly("org.postgresql:postgresql")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.springframework.security:spring-security-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testRuntimeOnly("com.h2database:h2")
    implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.4")
    implementation("net.logstash.logback:logstash-logback-encoder:8.0")
}

checkstyle {
    toolVersion = "10.21.4"
    configFile = file("config/checkstyle/checkstyle.xml")
    isIgnoreFailures = false
}

tasks.withType<Test> {
    useJUnitPlatform()
}

/**
 * ローカル開発用の秘密情報を bootRun に渡す。
 *
 * 実値は backend/.env（.gitignore 対象）に置き、docker compose と bootRun の両方が
 * そこを唯一の情報源とする。Spring Boot は .env を自動では読まないため、ここで環境変数に載せる。
 *
 * .env が無い場合は何もしない。test / build は application-test.yml で完結するため、
 * CIなど .env を置けない環境でも動く必要がある。
 */
tasks.named<org.springframework.boot.gradle.tasks.run.BootRun>("bootRun") {
    val envFile = rootProject.file(".env")
    if (envFile.exists()) {
        envFile.readLines()
            .map { it.trim() }
            .filter { it.isNotEmpty() && !it.startsWith("#") && it.contains("=") }
            .forEach { line ->
                val key = line.substringBefore("=").trim()
                val value = line.substringAfter("=").trim()
                environment(key, value)
            }
    }
}
