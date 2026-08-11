package com.raisetimeline.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 定期実行（{@code @Scheduled}）を有効にする。
 *
 * <p>test プロファイルでは有効にしない。{@code @SpringBootTest} は実際のアプリ設定を読むため、
 * 有効なままだとテストの実行中に裏で削除処理が走り、テストデータを消して
 * 原因の分かりにくい不安定さを生む。
 */
@Configuration
@Profile("!test")
@EnableScheduling
public class SchedulingConfig {
}
