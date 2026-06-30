package com.raisetimeline.api.user;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User savedUser;

    @BeforeEach
    void setUp() {
        savedUser = new User();
        savedUser.setEmail("search-test@example.com");
        savedUser.setPasswordHash(passwordEncoder.encode("Pass1234"));
        savedUser.setUsername("search_test_user");
        savedUser.setDisplayName("テストユーザー");
        savedUser.setYomi("てすとゆーざー");
        userRepository.insert(savedUser);
    }

    // --- findByEmail() の同値分割 ---

    @Test
    @DisplayName("findByEmail: 登録済みメール（有効クラス）→ Optional.of(user)")
    void findByEmail_existing_returnsUser() {
        Optional<User> result = userRepository.findByEmail("search-test@example.com");

        assertThat(result).isPresent();
        assertThat(result.get().getDisplayName()).isEqualTo("テストユーザー");
    }

    @Test
    @DisplayName("findByEmail: 未登録メール（無効クラス）→ Optional.empty()")
    void findByEmail_nonExisting_returnsEmpty() {
        Optional<User> result = userRepository.findByEmail("not-found@example.com");

        assertThat(result).isEmpty();
    }

    // --- search() の同値分割と仕様検証 ---

    @Test
    @DisplayName("search: 表示名の部分一致（有効クラス）→ ヒット")
    void search_byDisplayName_returnsUser() {
        User other = createUser("other@example.com", "other_user", "ダミー検索者", "だみーけんさくしゃ");

        List<User> result = userRepository.search("テスト", other.getId(), 0, 20);

        assertThat(result).anyMatch(u -> u.getDisplayName().equals("テストユーザー"));
    }

    @Test
    @DisplayName("search: yomi のひらがな一致（有効クラス）→ ヒット")
    void search_byHiraganaYomi_returnsUser() {
        User other = createUser("other2@example.com", "other_user2", "ダミー2", "だみー");

        List<User> result = userRepository.search("てすとゆーざー", other.getId(), 0, 20);

        assertThat(result).anyMatch(u -> u.getDisplayName().equals("テストユーザー"));
    }

    @Test
    @DisplayName("search: カタカナ入力でひらがな変換（正規化仕様）→ ヒット")
    void search_katakanaConvertsToHiragana_returnsUser() {
        User other = createUser("other3@example.com", "other_user3", "ダミー3", "だみー3");

        List<User> result = userRepository.search("テスト", other.getId(), 0, 20);

        assertThat(result).anyMatch(u -> u.getDisplayName().equals("テストユーザー"));
    }

    @Test
    @DisplayName("search: スペースを含む入力（正規化仕様）→ スペース除去後にヒット")
    void search_spacesStripped_returnsUser() {
        User other = createUser("other4@example.com", "other_user4", "ダミー4", "だみー4");

        List<User> result = userRepository.search("テ ス ト", other.getId(), 0, 20);

        assertThat(result).anyMatch(u -> u.getDisplayName().equals("テストユーザー"));
    }

    @Test
    @DisplayName("search: 自分自身は除外される（仕様）")
    void search_excludesSelf() {
        List<User> result = userRepository.search("テスト", savedUser.getId(), 0, 20);

        assertThat(result).noneMatch(u -> u.getId().equals(savedUser.getId()));
    }

    @Test
    @DisplayName("search: ヒットなし（無効クラス）→ 空リスト")
    void search_noMatch_returnsEmpty() {
        List<User> result = userRepository.search("zzzzz", savedUser.getId(), 0, 20);

        assertThat(result).isEmpty();
    }

    // --- insert() の境界値 ---

    @Test
    @DisplayName("insert: yomi が null でも登録できる（任意項目）")
    void insert_nullYomi_success() {
        User user = createUser("noyomi@example.com", "noyomi_user", "読み仮名なし", null);

        Optional<User> result = userRepository.findByEmail("noyomi@example.com");
        assertThat(result).isPresent();
        assertThat(result.get().getYomi()).isNull();
    }

    @Test
    @DisplayName("insert: yomi が 100 文字でも登録できる（最大値）")
    void insert_maxYomi_success() {
        String maxYomi = "あ".repeat(100);
        User user = new User();
        user.setEmail("maxyomi@example.com");
        user.setPasswordHash(passwordEncoder.encode("Pass1234"));
        user.setUsername("maxyomi_user");
        user.setDisplayName("最大読み仮名");
        user.setYomi(maxYomi);
        userRepository.insert(user);

        Optional<User> result = userRepository.findByEmail("maxyomi@example.com");
        assertThat(result).isPresent();
        assertThat(result.get().getYomi()).hasSize(100);
    }

    private User createUser(String email, String username, String displayName, String yomi) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("Pass1234"));
        user.setUsername(username);
        user.setDisplayName(displayName);
        user.setYomi(yomi);
        userRepository.insert(user);
        return user;
    }
}
