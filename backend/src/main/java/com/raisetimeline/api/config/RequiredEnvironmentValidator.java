package com.raisetimeline.api.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.ConfigurableEnvironment;

/**
 * 本番プロファイルで必須の環境変数が揃っているかを、起動のごく早い段階で検証する。
 *
 * <p>application-prod.yml は環境固有の値に既定値を持たせていないため、設定漏れがあれば
 * 起動には失敗する。ただしエラーの分かりやすさが項目によって違う。
 *
 * <ul>
 *   <li>{@code @Value} でバインドする項目（jwt.secret 等）… 「プレースホルダを解決できない」と
 *       キー名付きで報告されるため原因が明確</li>
 *   <li>{@code @ConfigurationProperties} でバインドする項目（spring.datasource.* 等）…
 *       未解決のプレースホルダが文字列のまま通るため、後段で
 *       「'url' must start with "jdbc"」のような無関係に見えるエラーになる</li>
 * </ul>
 *
 * <p>後者はデプロイ時に原因の特定へ余計な時間がかかる。そこで、Beanが1つも作られる前に
 * 必須キーをまとめて確認し、<b>不足しているものをすべて列挙した1つのエラー</b>で停止する。
 *
 * <p>秘密情報を含むため、ログにも例外にも<b>値そのものは出さずキー名だけ</b>を出す。
 *
 * <p>{@code prod} プロファイルのときだけ動く。ローカル開発と自動テストには影響しない。
 */
public class RequiredEnvironmentValidator
        implements ApplicationListener<ApplicationEnvironmentPreparedEvent> {

    /** この検証を行うプロファイル。 */
    private static final String TARGET_PROFILE = "prod";

    /**
     * 本番で必ず設定されていなければならない環境変数。
     *
     * <p>application-prod.yml の「必要な環境変数」と対応する。任意の項目
     * （SERVER_PORT / AWS_S3_ENDPOINT / AWS_S3_ACCESS_KEY 等、既定値を持つもの）は含めない。
     */
    private static final List<String> REQUIRED_KEYS = List.of(
            "DB_URL",
            "DB_USERNAME",
            "DB_PASSWORD",
            "JWT_SECRET",
            "CORS_ALLOWED_ORIGINS",
            "AWS_S3_BUCKET_NAME",
            "AWS_S3_REGION");

    @Override
    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {
        ConfigurableEnvironment environment = event.getEnvironment();
        if (!List.of(environment.getActiveProfiles()).contains(TARGET_PROFILE)) {
            return;
        }

        List<String> missing = new ArrayList<>();
        for (String key : REQUIRED_KEYS) {
            String value = environment.getProperty(key);
            if (value == null || value.isBlank()) {
                missing.add(key);
            }
        }

        if (!missing.isEmpty()) {
            throw new IllegalStateException(
                    "本番プロファイル（" + TARGET_PROFILE + "）で必須の設定がありません: "
                            + String.join(", ", missing)
                            + "\n実行環境の環境変数を確認してください。"
                            + "必要な変数の一覧は application-prod.yml の冒頭コメントにあります。");
        }
    }
}
