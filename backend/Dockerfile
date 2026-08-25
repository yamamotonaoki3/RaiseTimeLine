# --- ビルドステージ ---
# ここでのみJDK・Gradleを使う。実行イメージにはビルドツールを含めない。
# バージョンは25系の最新（フローティングタグ）ではなく、パッチ番号まで固定する。
# 更新する場合は `docker buildx imagetools inspect eclipse-temurin:25-jdk` で最新のタグ名を確認してから変更する。
FROM eclipse-temurin:25.0.4_7-jdk AS build
WORKDIR /workspace

COPY gradlew gradlew
COPY gradle gradle
COPY build.gradle.kts settings.gradle.kts ./
# WindowsでチェックアウトしたgradlewはCRLFになっていることがあり、
# そのままでは "gradlew: not found" になるためLFへ変換する。
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew

COPY config config
COPY src src

# テストはCIで実行済みの前提。イメージビルドはbootJarの生成のみ行う。
RUN ./gradlew --no-daemon bootJar -x test

# --- 実行ステージ ---
# JRE専用の軽量イメージにビルド成果物のjarだけをコピーする。
# ビルドステージと同じバージョン（25.0.4_7）で揃える。
FROM eclipse-temurin:25.0.4_7-jre AS runtime

RUN addgroup --system spring && adduser --system --ingroup spring spring
WORKDIR /app
COPY --from=build /workspace/build/libs/*.jar app.jar
USER spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
