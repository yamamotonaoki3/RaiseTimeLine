package com.raisetimeline.api.user;

import com.raisetimeline.api.exception.BadRequestException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AvatarStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png");

    @Value("${app.upload.dir}")
    private String uploadDir;

    public String store(MultipartFile file, String oldUrl) {
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new BadRequestException("画像は JPEG・PNG 形式でアップロードしてください");
        }
        String ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new BadRequestException("画像は JPEG・PNG 形式でアップロードしてください");
        }

        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);

            String filename = UUID.randomUUID() + "." + ext;
            Path dest = dir.resolve(filename);
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, dest, StandardCopyOption.REPLACE_EXISTING);
            }

            deleteOld(oldUrl);

            return "/avatars/" + filename;
        } catch (IOException e) {
            throw new BadRequestException("画像の保存に失敗しました");
        }
    }

    private void deleteOld(String oldUrl) {
        if (oldUrl == null || !oldUrl.startsWith("/avatars/")) {
            return;
        }
        String filename = oldUrl.substring("/avatars/".length());
        Path old = Paths.get(uploadDir, filename);
        try {
            Files.deleteIfExists(old);
        } catch (IOException e) {
            // 削除失敗は無視
        }
    }
}
