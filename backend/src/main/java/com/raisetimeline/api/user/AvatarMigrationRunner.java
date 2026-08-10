package com.raisetimeline.api.user;

import com.raisetimeline.api.storage.S3StorageService;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * アバター画像をローカルディスクからS3へ移す一回限りの処理。
 *
 * <p>V11 マイグレーションはカラム名を avatar_url から avatar_key に変えるだけで、
 * 値は「/avatars/xxx.png」という配信パスのまま残っている。実ファイルのアップロードは
 * SQLでは行えないため、ここで行う。
 *
 * <p><b>既定では動作しない。</b> {@code app.migration.avatar-to-s3=true} を指定した
 * ときだけ実行する。移行対象は「/avatars/」で始まる行のみで、移行後はその形式で
 * なくなるため、<b>繰り返し起動しても二重に処理されない（冪等）</b>。
 *
 * <p>移行が完了したらフラグを戻し、このクラスと {@code app.upload.dir} 設定は
 * 別Issueで削除する。
 */
@Component
@ConditionalOnProperty(name = "app.migration.avatar-to-s3", havingValue = "true")
public class AvatarMigrationRunner implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(AvatarMigrationRunner.class);

    /** 移行前の値の形式。Springの静的配信のパス。 */
    private static final String LEGACY_PREFIX = "/avatars/";
    private static final String KEY_PREFIX = "avatars/";

    private final UserRepository userRepository;
    private final S3StorageService s3StorageService;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public AvatarMigrationRunner(UserRepository userRepository, S3StorageService s3StorageService) {
        this.userRepository = userRepository;
        this.s3StorageService = s3StorageService;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<User> targets = userRepository.findByAvatarKeyPrefix(LEGACY_PREFIX);
        if (targets.isEmpty()) {
            LOG.info("アバター移行: 対象なし（移行済みか、対象データがありません）");
            return;
        }

        int migrated = 0;
        int missing = 0;
        for (User user : targets) {
            String fileName = user.getAvatarKey().substring(LEGACY_PREFIX.length());
            Path file = Paths.get(uploadDir, fileName);

            if (!Files.isRegularFile(file)) {
                // ファイルが見つからない場合はアバターなしに落とす。起動は止めない
                userRepository.updateAvatarKey(user.getId(), null);
                missing++;
                LOG.warn("アバター移行: ファイルが見つかりません userId={} path={}", user.getId(), file);
                continue;
            }

            String key = KEY_PREFIX + fileName;
            try (InputStream in = Files.newInputStream(file)) {
                s3StorageService.put(key, in, Files.size(file), contentTypeOf(fileName));
            } catch (IOException e) {
                LOG.error("アバター移行: 読み込みに失敗しました userId={} path={}", user.getId(), file, e);
                continue;
            }
            userRepository.updateAvatarKey(user.getId(), key);
            migrated++;
        }

        LOG.info("アバター移行: 完了 対象={} 移行={} ファイル欠損={}", targets.size(), migrated, missing);
    }

    private String contentTypeOf(String fileName) {
        String lower = fileName.toLowerCase();
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        return "image/jpeg";
    }
}
