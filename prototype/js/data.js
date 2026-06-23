// ─── モックデータ ───────────────────────────────────────────────

let currentUser = null;

let users = [
  { id: 1, displayName: "山田太郎", yomi: "やまだたろう", email: "taro@example.com", password: "password1", avatarUrl: null, bio: "RaiseTech で Java と React を勉強中！フルスタックエンジニアを目指しています。", createdAt: "2026-01-10T09:00:00Z" },
  { id: 2, displayName: "鈴木花子", yomi: "すずきはなこ", email: "hanako@example.com", password: "password2", avatarUrl: null, bio: "フロントエンドが大好き。React / TypeScript / CSS が得意です 🎨", createdAt: "2026-01-11T10:00:00Z" },
  { id: 3, displayName: "田中一郎", yomi: "たなかいちろう", email: "ichiro@example.com", password: "password3", avatarUrl: null, bio: "バックエンドエンジニア。Spring Boot / Java 歴5年。最近は AWS にハマってます。", createdAt: "2026-01-12T11:00:00Z" },
  { id: 4, displayName: "佐藤美咲", yomi: "さとうみさき", email: "misaki@example.com", password: "password4", avatarUrl: null, bio: "UI/UX デザイナー兼フロントエンドエンジニア。きれいな画面を作るのが好きです ✨", createdAt: "2026-01-13T12:00:00Z" },
  { id: 5, displayName: "高橋健二", yomi: "たかはしけんじ", email: "kenji@example.com", password: "password5", avatarUrl: null, bio: "インフラ・DevOps 担当。Docker / Kubernetes / Terraform が日常です。", createdAt: "2026-01-14T13:00:00Z" },
  { id: 6, displayName: "中村さくら", yomi: "なかむらさくら", email: "sakura@example.com", password: "password6", avatarUrl: null, bio: "駆け出しエンジニア。毎日コードを書いて成長中🌸 よろしくお願いします！", createdAt: "2026-02-01T09:00:00Z" },
  { id: 7, displayName: "小林大輔", yomi: "こばやしだいすけ", email: "daisuke@example.com", password: "password7", avatarUrl: null, bio: "データエンジニア。PostgreSQL と Python が専門。最近機械学習も始めました。", createdAt: "2026-02-10T10:00:00Z" },
  { id: 8, displayName: "渡辺ゆい", yomi: "わたなべゆい", email: "yui@example.com", password: "password8", avatarUrl: null, bio: "モバイルエンジニア（iOS / Android）。最近 React Native も触り始めました📱", createdAt: "2026-02-15T11:00:00Z" },
];

let nextUserId = 9;

let posts = [
  // 山田太郎 (id:1) の投稿
  { id: 1,  userId: 1, content: "RaiseTimeLine を作り始めました！要件定義書が完成してようやく実装フェーズに入れます。長かった…🎉", imageUrl: null, createdAt: "2026-06-20T08:00:00Z", updatedAt: "2026-06-20T08:00:00Z" },
  { id: 2,  userId: 1, content: "フォロー機能の設計が完成しました！follows テーブルに UNIQUE 制約を入れることで DB レベルで重複フォローを防いでいます。地味だけど大事なポイント。", imageUrl: null, createdAt: "2026-06-21T09:30:00Z", updatedAt: "2026-06-21T09:30:00Z" },
  { id: 3,  userId: 1, content: "JWT 認証の実装が終わった！Spring Security 6 は設定が大きく変わっていて最初は戸惑ったけど、慣れたら直感的で書きやすい。", imageUrl: null, createdAt: "2026-06-22T10:00:00Z", updatedAt: "2026-06-22T10:00:00Z" },
  { id: 4,  userId: 1, content: "プロトタイプモックを HTML/CSS/JS だけで作り始めました。ルーターを自作するのが意外と楽しい！ハッシュ変化でページを切り替える仕組みを実装中。", imageUrl: null, createdAt: "2026-06-23T12:00:00Z", updatedAt: "2026-06-23T12:00:00Z" },

  // 鈴木花子 (id:2) の投稿
  { id: 5,  userId: 2, content: "React 19 の新機能、本当に便利になりましたね！use() フック周りの変更が特にお気に入りです。みなさんもう試しましたか？", imageUrl: null, createdAt: "2026-06-20T10:30:00Z", updatedAt: "2026-06-20T10:30:00Z" },
  { id: 6,  userId: 2, content: "CSS の新しい機能 @layer が使えるようになってきて、スタイルの管理がめちゃくちゃ楽になりました。BEM とか SMACSS とかいらなくなるかも。", imageUrl: null, createdAt: "2026-06-21T11:00:00Z", updatedAt: "2026-06-21T11:00:00Z" },
  { id: 7,  userId: 2, content: "いいね機能を実装しました。UNIQUE 制約で重複を防ぎつつ、フロントエンドでは楽観的更新（Optimistic UI）を使ってレスポンスを速く見せています。", imageUrl: null, createdAt: "2026-06-22T14:00:00Z", updatedAt: "2026-06-22T14:00:00Z" },
  { id: 8,  userId: 2, content: "TypeScript 6 の型推論がさらに強化されていて感動。特に関数の戻り値の型が自動で絞り込まれるようになった部分が最高。", imageUrl: null, createdAt: "2026-06-23T09:00:00Z", updatedAt: "2026-06-23T09:00:00Z" },

  // 田中一郎 (id:3) の投稿
  { id: 9,  userId: 3, content: "Spring Boot 4.0 で REST API を実装中です。@RestController と @RequestMapping だけで API が作れるのは本当に楽ですね。Gradle のビルドも爆速になった気がする。", imageUrl: null, createdAt: "2026-06-20T09:00:00Z", updatedAt: "2026-06-20T09:00:00Z" },
  { id: 10, userId: 3, content: "JUnit 5 でテストを書いていたら、コードのバグを3つ発見できました。やっぱりテストは大事。TDD を始めてみようかな…", imageUrl: null, createdAt: "2026-06-21T13:00:00Z", updatedAt: "2026-06-21T13:00:00Z" },
  { id: 11, userId: 3, content: "AWS RDS で PostgreSQL 17 を立ち上げました。マルチ AZ 構成にするか悩んだけど、コストを考えてとりあえずシングル AZ で。本番は必ずマルチ AZ にします。", imageUrl: null, createdAt: "2026-06-22T16:00:00Z", updatedAt: "2026-06-22T16:00:00Z" },

  // 佐藤美咲 (id:4) の投稿
  { id: 12, userId: 4, content: "ワイヤーフレームを Figma で作り直しました！モバイルファーストで設計すると PC でも自然と使いやすい UI になりますね。今日のおすすめはシンプル is ベスト。", imageUrl: null, createdAt: "2026-06-20T11:00:00Z", updatedAt: "2026-06-20T11:00:00Z" },
  { id: 13, userId: 4, content: "ユーザー検索機能のデザインが完成！キーワード入力フィールドをフォーカスしたとき、サジェストが出るようにするとより UX が上がりそう。次のバージョンで実装したい。", imageUrl: null, createdAt: "2026-06-21T15:00:00Z", updatedAt: "2026-06-21T15:00:00Z" },
  { id: 14, userId: 4, content: "カラーパレットを #1d9bf0 (青) をメインに決定。アクセシビリティ（コントラスト比）も確認済みです。みんな配色ってどうやって決めてる？", imageUrl: null, createdAt: "2026-06-22T12:00:00Z", updatedAt: "2026-06-22T12:00:00Z" },
  { id: 15, userId: 4, content: "プロフィール編集画面のモーダルデザインができた！アイコン画像のプレビューがリアルタイムで変わるの、地味だけどこだわりのポイントです 👀", imageUrl: null, createdAt: "2026-06-23T13:00:00Z", updatedAt: "2026-06-23T13:00:00Z" },

  // 高橋健二 (id:5) の投稿
  { id: 16, userId: 5, content: "Docker で PostgreSQL 17 を起動！docker compose up -d の一発で環境が整うの、本当に便利すぎる。数年前の自分に教えてあげたい。", imageUrl: null, createdAt: "2026-06-20T13:00:00Z", updatedAt: "2026-06-20T13:00:00Z" },
  { id: 17, userId: 5, content: "GitHub Actions で CI を組みました。push するたびにテストが自動実行される快適さ。一度体験したらもう手動テストには戻れない。", imageUrl: null, createdAt: "2026-06-21T17:00:00Z", updatedAt: "2026-06-21T17:00:00Z" },
  { id: 18, userId: 5, content: "AWS ALB + EC2 の構成でデプロイ完了！Route 53 でドメインも設定して、ついに HTTPS で動くようになりました。感動🎉", imageUrl: null, createdAt: "2026-06-23T11:00:00Z", updatedAt: "2026-06-23T11:00:00Z" },

  // 中村さくら (id:6) の投稿
  { id: 19, userId: 6, content: "プログラミングを始めて3ヶ月。ようやく Hello World 以外のものが作れるようになってきました🌸 毎日少しずつ進歩してる実感があります！", imageUrl: null, createdAt: "2026-06-21T10:00:00Z", updatedAt: "2026-06-21T10:00:00Z" },
  { id: 20, userId: 6, content: "HTML/CSS だけでこんなにリッチな画面が作れるんだ…と感動しています。JavaScript も少しずつわかってきた気がします🌟", imageUrl: null, createdAt: "2026-06-22T11:00:00Z", updatedAt: "2026-06-22T11:00:00Z" },

  // 小林大輔 (id:7) の投稿
  { id: 21, userId: 7, content: "PostgreSQL の EXPLAIN ANALYZE で遅いクエリを特定してインデックスを貼ったら、1200ms → 8ms になりました。インデックスは本当に大事。", imageUrl: null, createdAt: "2026-06-21T14:00:00Z", updatedAt: "2026-06-21T14:00:00Z" },
  { id: 22, userId: 7, content: "Python の Pandas で10万行のデータを集計するスクリプトを書きました。最初は1分かかっていたのが、vectorize を使ったら3秒に。感動。", imageUrl: null, createdAt: "2026-06-23T10:00:00Z", updatedAt: "2026-06-23T10:00:00Z" },

  // 渡辺ゆい (id:8) の投稿
  { id: 23, userId: 8, content: "React Native で iOS / Android 共通のアプリを作っています。一つのコードで両方動くの、本当に革命ですよね。ネイティブと比べてパフォーマンスも十分になってきた。", imageUrl: null, createdAt: "2026-06-22T09:00:00Z", updatedAt: "2026-06-22T09:00:00Z" },
  { id: 24, userId: 8, content: "モバイルアプリの UX を考えるとき、「親指が届く範囲」を意識するようになりました。重要なボタンは画面下部に配置するのが使いやすいですよ📱", imageUrl: null, createdAt: "2026-06-23T14:00:00Z", updatedAt: "2026-06-23T14:00:00Z" },
];

let nextPostId = 25;

let comments = [
  { id: 1,  postId: 1,  userId: 2, content: "おめでとうございます！要件定義、すごく丁寧でした。参考にさせてもらいます。", createdAt: "2026-06-20T08:15:00Z" },
  { id: 2,  postId: 1,  userId: 3, content: "実装フェーズ、一緒に頑張りましょう！何か詰まったら相談してください。", createdAt: "2026-06-20T08:30:00Z" },
  { id: 3,  postId: 1,  userId: 6, content: "私も同じタイミングで始めました！一緒に成長できたら嬉しいです🌸", createdAt: "2026-06-20T09:00:00Z" },
  { id: 4,  postId: 3,  userId: 2, content: "Spring Security 6 の設定変更、私も最初ハマりました。SecurityFilterChain を Bean 登録する書き方に慣れると快適ですよ！", createdAt: "2026-06-22T10:30:00Z" },
  { id: 5,  postId: 3,  userId: 5, content: "JWT のシークレットキーは環境変数で管理してますか？ハードコードは危険なので気をつけて！", createdAt: "2026-06-22T11:00:00Z" },
  { id: 6,  postId: 5,  userId: 1, content: "use() フック、確かに便利ですよね！非同期処理がスッキリ書けるようになった気がします。", createdAt: "2026-06-20T11:00:00Z" },
  { id: 7,  postId: 5,  userId: 3, content: "まだ試せていないので今週末に触ってみます！", createdAt: "2026-06-20T11:30:00Z" },
  { id: 8,  postId: 9,  userId: 1, content: "Spring Boot 4 の起動速度上がりましたよね！GraalVM ネイティブビルドも試してみたいです。", createdAt: "2026-06-20T09:30:00Z" },
  { id: 9,  postId: 16, userId: 1, content: "docker compose 最高ですよね。docker-compose.yml を git 管理しておけば誰でも同じ環境が作れる。", createdAt: "2026-06-20T13:30:00Z" },
  { id: 10, postId: 16, userId: 2, content: "WSL2 + Docker Desktop の組み合わせが Windows でも快適です！", createdAt: "2026-06-20T14:00:00Z" },
  { id: 11, postId: 17, userId: 3, content: "CI/CD 大事ですよね。次は CD（自動デプロイ）も組んでみてください！", createdAt: "2026-06-21T17:30:00Z" },
  { id: 12, postId: 21, userId: 1, content: "インデックスの効果すごい！どのカラムに貼ったんですか？", createdAt: "2026-06-21T14:30:00Z" },
  { id: 13, postId: 21, userId: 3, content: "EXPLAIN ANALYZE は本当に便利ですよね。Seq Scan が出てたらまずインデックスを疑う。", createdAt: "2026-06-21T15:00:00Z" },
  { id: 14, postId: 19, userId: 1, content: "3ヶ月でここまで来れたのはすごい！これからも一緒に頑張りましょう 💪", createdAt: "2026-06-21T10:30:00Z" },
  { id: 15, postId: 19, userId: 4, content: "応援しています！わからないことがあればいつでも聞いてください✨", createdAt: "2026-06-21T11:00:00Z" },
  { id: 16, postId: 14, userId: 2, content: "配色の決め方、私はまず Primary カラーを決めてから派生色を計算しています。ツールだと Coolors が便利ですよ！", createdAt: "2026-06-22T12:30:00Z" },
  { id: 17, postId: 18, userId: 1, content: "デプロイおめでとう！URL 教えてほしいです！", createdAt: "2026-06-23T11:30:00Z" },
  { id: 18, postId: 18, userId: 7, content: "ALB のターゲットグループのヘルスチェック設定、ハマりどころが多いので気をつけて！", createdAt: "2026-06-23T12:00:00Z" },
];

let nextCommentId = 19;

let likes = [
  // 投稿1へのいいね
  { id: 1,  postId: 1,  userId: 2 },
  { id: 2,  postId: 1,  userId: 3 },
  { id: 3,  postId: 1,  userId: 4 },
  { id: 4,  postId: 1,  userId: 5 },
  { id: 5,  postId: 1,  userId: 6 },
  // 投稿3
  { id: 6,  postId: 3,  userId: 2 },
  { id: 7,  postId: 3,  userId: 5 },
  // 投稿5
  { id: 8,  postId: 5,  userId: 1 },
  { id: 9,  postId: 5,  userId: 3 },
  { id: 10, postId: 5,  userId: 4 },
  { id: 11, postId: 5,  userId: 7 },
  // 投稿7
  { id: 12, postId: 7,  userId: 1 },
  { id: 13, postId: 7,  userId: 3 },
  // 投稿9
  { id: 14, postId: 9,  userId: 1 },
  { id: 15, postId: 9,  userId: 2 },
  { id: 16, postId: 9,  userId: 4 },
  // 投稿12
  { id: 17, postId: 12, userId: 1 },
  { id: 18, postId: 12, userId: 2 },
  { id: 19, postId: 12, userId: 5 },
  { id: 20, postId: 12, userId: 8 },
  // 投稿14
  { id: 21, postId: 14, userId: 1 },
  { id: 22, postId: 14, userId: 3 },
  { id: 23, postId: 14, userId: 6 },
  // 投稿16
  { id: 24, postId: 16, userId: 1 },
  { id: 25, postId: 16, userId: 2 },
  { id: 26, postId: 16, userId: 3 },
  { id: 27, postId: 16, userId: 7 },
  // 投稿17
  { id: 28, postId: 17, userId: 1 },
  { id: 29, postId: 17, userId: 2 },
  { id: 30, postId: 17, userId: 3 },
  // 投稿18
  { id: 31, postId: 18, userId: 1 },
  { id: 32, postId: 18, userId: 2 },
  { id: 33, postId: 18, userId: 3 },
  { id: 34, postId: 18, userId: 4 },
  { id: 35, postId: 18, userId: 6 },
  // 投稿21
  { id: 36, postId: 21, userId: 1 },
  { id: 37, postId: 21, userId: 3 },
  { id: 38, postId: 21, userId: 5 },
  // 投稿19
  { id: 39, postId: 19, userId: 1 },
  { id: 40, postId: 19, userId: 2 },
  { id: 41, postId: 19, userId: 4 },
  // 投稿23
  { id: 42, postId: 23, userId: 1 },
  { id: 43, postId: 23, userId: 4 },
  { id: 44, postId: 23, userId: 6 },
];

let nextLikeId = 45;

let follows = [
  // 山田太郎(1) が フォロー → 花子(2)、一郎(3)、健二(5)、さくら(6)
  { id: 1,  followerId: 1, followeeId: 2 },
  { id: 2,  followerId: 1, followeeId: 3 },
  { id: 3,  followerId: 1, followeeId: 5 },
  { id: 4,  followerId: 1, followeeId: 6 },
  // 鈴木花子(2) が フォロー → 太郎(1)、一郎(3)、美咲(4)、大輔(7)
  { id: 5,  followerId: 2, followeeId: 1 },
  { id: 6,  followerId: 2, followeeId: 3 },
  { id: 7,  followerId: 2, followeeId: 4 },
  { id: 8,  followerId: 2, followeeId: 7 },
  // 田中一郎(3) が フォロー → 太郎(1)、花子(2)、健二(5)
  { id: 9,  followerId: 3, followeeId: 1 },
  { id: 10, followerId: 3, followeeId: 2 },
  { id: 11, followerId: 3, followeeId: 5 },
  // 佐藤美咲(4) が フォロー → 太郎(1)、花子(2)、さくら(6)、ゆい(8)
  { id: 12, followerId: 4, followeeId: 1 },
  { id: 13, followerId: 4, followeeId: 2 },
  { id: 14, followerId: 4, followeeId: 6 },
  { id: 15, followerId: 4, followeeId: 8 },
  // 高橋健二(5) が フォロー → 太郎(1)、一郎(3)、大輔(7)
  { id: 16, followerId: 5, followeeId: 1 },
  { id: 17, followerId: 5, followeeId: 3 },
  { id: 18, followerId: 5, followeeId: 7 },
  // 中村さくら(6) が フォロー → 太郎(1)、花子(2)、美咲(4)
  { id: 19, followerId: 6, followeeId: 1 },
  { id: 20, followerId: 6, followeeId: 2 },
  { id: 21, followerId: 6, followeeId: 4 },
  // 小林大輔(7) が フォロー → 一郎(3)、健二(5)
  { id: 22, followerId: 7, followeeId: 3 },
  { id: 23, followerId: 7, followeeId: 5 },
  // 渡辺ゆい(8) が フォロー → 花子(2)、美咲(4)
  { id: 24, followerId: 8, followeeId: 2 },
  { id: 25, followerId: 8, followeeId: 4 },
];

let nextFollowId = 26;

// ─── ヘルパー関数 ────────────────────────────────────────────────

function getUserById(id) {
  return users.find(u => u.id === Number(id)) || null;
}

function getPostById(id) {
  return posts.find(p => p.id === Number(id)) || null;
}

function getLikeCount(postId) {
  return likes.filter(l => l.postId === Number(postId)).length;
}

function isLiked(postId, userId) {
  return likes.some(l => l.postId === Number(postId) && l.userId === Number(userId));
}

function getCommentCount(postId) {
  return comments.filter(c => c.postId === Number(postId)).length;
}

function getCommentsByPostId(postId) {
  return comments.filter(c => c.postId === Number(postId))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function isFollowing(followerId, followeeId) {
  return follows.some(f => f.followerId === Number(followerId) && f.followeeId === Number(followeeId));
}

function getFollowingIds(userId) {
  return follows.filter(f => f.followerId === Number(userId)).map(f => f.followeeId);
}

function getFollowers(userId) {
  const followerIds = follows.filter(f => f.followeeId === Number(userId)).map(f => f.followerId);
  return users.filter(u => followerIds.includes(u.id));
}

function getFollowing(userId) {
  const followingIds = follows.filter(f => f.followerId === Number(userId)).map(f => f.followeeId);
  return users.filter(u => followingIds.includes(u.id));
}

function getFollowerCount(userId) {
  return follows.filter(f => f.followeeId === Number(userId)).length;
}

function getFollowingCount(userId) {
  return follows.filter(f => f.followerId === Number(userId)).length;
}

function getPostsByUserId(userId) {
  return posts.filter(p => p.userId === Number(userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getTimelineAll() {
  return [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getTimelineFollowing(userId) {
  const ids = getFollowingIds(userId);
  ids.push(Number(userId));
  return posts.filter(p => ids.includes(p.userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}日前`;
  return new Date(dateStr).toLocaleDateString('ja-JP');
}

function getAvatarHtml(user, size = 40) {
  if (user && user.avatarUrl) {
    return `<img src="${user.avatarUrl}" alt="${escapeHtml(user.displayName)}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;">`;
  }
  const initials = user ? user.displayName.charAt(0) : '?';
  const colors = ['#1d9bf0','#17bf63','#ffad1f','#f45d22','#794bc4','#e0245e','#00c2ff','#ff6b6b'];
  const color = user ? colors[user.id % colors.length] : '#888';
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-size:${Math.floor(size*0.4)}px;font-weight:bold;flex-shrink:0;">${initials}</div>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
