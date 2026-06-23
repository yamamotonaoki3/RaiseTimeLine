// ─── 共通コンポーネント ───────────────────────────────────────────

function renderNav() {
  if (!currentUser) return '';
  return `
    <nav class="nav">
      <div class="nav-inner">
        <a class="nav-logo" href="#/">RaiseTimeLine</a>
        <div class="nav-links">
          <a href="#/" class="nav-link">🏠 ホーム</a>
          <a href="#/search" class="nav-link">🔍 検索</a>
          <a href="#/users/${currentUser.id}" class="nav-link">👤 マイページ</a>
          <button class="btn btn-ghost btn-sm" onclick="logout()">ログアウト</button>
        </div>
      </div>
    </nav>`;
}

function logout() {
  currentUser = null;
  location.hash = '#/login';
}

// ─── モーダル共通 ─────────────────────────────────────────────────

function openModal(contentHtml) {
  const overlay = document.createElement('div');
  overlay.id = 'modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-card">${contentHtml}</div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
}

function closeModal() {
  const el = document.getElementById('modal-overlay');
  if (el) el.remove();
}

// ─── S-07 投稿作成モーダル ────────────────────────────────────────

function openCreatePostModal() {
  openModal(`
    <div class="modal-header">
      <h2 class="modal-title">投稿を作成</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <textarea id="post-text" class="textarea" rows="4" maxlength="280" placeholder="いまどうしてる？" oninput="updateCount('post-text','post-count',280)"></textarea>
      <div class="char-count"><span id="post-count">0</span>/280</div>
      <div id="post-image-preview" class="image-preview-wrap"></div>
      <label class="btn btn-ghost btn-sm" style="cursor:pointer;">
        📷 画像を添付
        <input type="file" id="post-image-input" accept="image/jpeg,image/png,image/gif" style="display:none;" onchange="previewImage('post-image-input','post-image-preview')">
      </label>
      <div id="post-error" class="error-msg" style="display:none;"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-primary" onclick="submitCreatePost()">投稿する</button>
    </div>
  `);
}

function submitCreatePost() {
  const text = document.getElementById('post-text').value.trim();
  const errEl = document.getElementById('post-error');
  if (!text || text.length > 280) {
    errEl.textContent = '投稿テキストは1〜280文字で入力してください';
    errEl.style.display = 'block';
    return;
  }

  const imageInput = document.getElementById('post-image-input');
  const imageUrl = (imageInput.files[0] && imageInput.dataset.dataUrl) ? imageInput.dataset.dataUrl : null;

  const now = new Date().toISOString();
  const newPost = { id: nextPostId++, userId: currentUser.id, content: text, imageUrl, createdAt: now, updatedAt: now };
  posts.unshift(newPost);
  closeModal();
  renderTimeline();
}

// ─── S-08 投稿編集モーダル ────────────────────────────────────────

function openEditPostModal(postId) {
  const post = getPostById(postId);
  if (!post) return;

  openModal(`
    <div class="modal-header">
      <h2 class="modal-title">投稿を編集</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <textarea id="edit-post-text" class="textarea" rows="4" maxlength="280" oninput="updateCount('edit-post-text','edit-post-count',280)">${escapeHtml(post.content)}</textarea>
      <div class="char-count"><span id="edit-post-count">${post.content.length}</span>/280</div>
      <div id="edit-image-preview" class="image-preview-wrap">
        ${post.imageUrl ? `<img src="${post.imageUrl}" class="preview-img"><button class="btn btn-ghost btn-sm" onclick="clearEditImage(${postId})">画像を削除</button>` : ''}
      </div>
      <label class="btn btn-ghost btn-sm" style="cursor:pointer;">
        🔄 画像を変更
        <input type="file" id="edit-image-input" accept="image/jpeg,image/png,image/gif" style="display:none;" onchange="previewImage('edit-image-input','edit-image-preview')">
      </label>
      <div id="edit-post-error" class="error-msg" style="display:none;"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-primary" onclick="submitEditPost(${postId})">保存する</button>
    </div>
  `);
}

function clearEditImage(postId) {
  const preview = document.getElementById('edit-image-preview');
  if (preview) preview.innerHTML = '';
  const input = document.getElementById('edit-image-input');
  if (input) { input.value = ''; delete input.dataset.dataUrl; }
  const post = getPostById(postId);
  if (post) post._clearImage = true;
}

function submitEditPost(postId) {
  const post = getPostById(postId);
  if (!post) return;
  const text = document.getElementById('edit-post-text').value.trim();
  const errEl = document.getElementById('edit-post-error');
  if (!text || text.length > 280) {
    errEl.textContent = '投稿テキストは1〜280文字で入力してください';
    errEl.style.display = 'block';
    return;
  }

  const imageInput = document.getElementById('edit-image-input');
  if (imageInput.dataset.dataUrl) {
    post.imageUrl = imageInput.dataset.dataUrl;
  } else if (post._clearImage) {
    post.imageUrl = null;
  }
  delete post._clearImage;

  post.content = text;
  post.updatedAt = new Date().toISOString();
  closeModal();
  renderPostDetail(postId);
}

// ─── S-10 プロフィール編集モーダル ───────────────────────────────

function openEditProfileModal() {
  const u = currentUser;
  openModal(`
    <div class="modal-header">
      <h2 class="modal-title">プロフィールを編集</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div id="profile-avatar-preview">${getAvatarHtml(u, 60)}</div>
        <label class="btn btn-ghost btn-sm" style="cursor:pointer;">
          📷 画像を変更
          <input type="file" id="profile-avatar-input" accept="image/jpeg,image/png" style="display:none;" onchange="previewAvatar()">
        </label>
      </div>
      <label class="form-label">表示名 <span class="required">*</span></label>
      <input type="text" id="profile-name" class="input" maxlength="50" value="${escapeHtml(u.displayName)}" oninput="updateCount('profile-name','profile-name-count',50)">
      <div class="char-count"><span id="profile-name-count">${u.displayName.length}</span>/50</div>
      <label class="form-label">自己紹介</label>
      <textarea id="profile-bio" class="textarea" rows="3" maxlength="160" oninput="updateCount('profile-bio','profile-bio-count',160)">${escapeHtml(u.bio || '')}</textarea>
      <div class="char-count"><span id="profile-bio-count">${(u.bio || '').length}</span>/160</div>
      <div id="profile-error" class="error-msg" style="display:none;"></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-ghost" onclick="closeModal()">キャンセル</button>
      <button class="btn btn-primary" onclick="submitEditProfile()">保存する</button>
    </div>
  `);
}

function previewAvatar() {
  const input = document.getElementById('profile-avatar-input');
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    input.dataset.dataUrl = e.target.result;
    document.getElementById('profile-avatar-preview').innerHTML =
      `<img src="${e.target.result}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;">`;
  };
  reader.readAsDataURL(file);
}

function submitEditProfile() {
  const name = document.getElementById('profile-name').value.trim();
  const bio = document.getElementById('profile-bio').value.trim();
  const errEl = document.getElementById('profile-error');

  if (!name || name.length > 50) {
    errEl.textContent = '表示名は1〜50文字で入力してください';
    errEl.style.display = 'block';
    return;
  }
  if (bio.length > 160) {
    errEl.textContent = '自己紹介文は160文字以内で入力してください';
    errEl.style.display = 'block';
    return;
  }

  const avatarInput = document.getElementById('profile-avatar-input');
  const userInList = users.find(u => u.id === currentUser.id);
  if (avatarInput.dataset.dataUrl) {
    currentUser.avatarUrl = avatarInput.dataset.dataUrl;
    if (userInList) userInList.avatarUrl = avatarInput.dataset.dataUrl;
  }
  currentUser.displayName = name;
  currentUser.bio = bio;
  if (userInList) { userInList.displayName = name; userInList.bio = bio; }

  closeModal();
  renderProfile(currentUser.id);
}

// ─── D-01 削除確認ダイアログ ─────────────────────────────────────

function openDeleteDialog(type, id, onDelete) {
  const label = type === 'post' ? '投稿' : 'コメント';
  openModal(`
    <div class="modal-body" style="text-align:center;padding:32px 24px;">
      <p style="font-size:18px;margin-bottom:8px;">⚠️ この${label}を削除しますか？</p>
      <p style="color:#666;margin-bottom:24px;">この操作は元に戻せません。</p>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button class="btn btn-ghost" onclick="closeModal()">キャンセル</button>
        <button class="btn btn-danger" onclick="(${onDelete.toString()})();closeModal();">削除する</button>
      </div>
    </div>
  `);
}

// ─── 共通ユーティリティ ───────────────────────────────────────────

function updateCount(inputId, countId, max) {
  const el = document.getElementById(inputId);
  const countEl = document.getElementById(countId);
  if (!el || !countEl) return;
  const len = el.value.length;
  countEl.textContent = len;
  countEl.style.color = len > max ? '#e0245e' : '';
}

function previewImage(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const file = input.files[0];
  if (!file || !preview) return;

  if (file.size > 5 * 1024 * 1024) {
    alert('画像は5MB以内でアップロードしてください');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    input.dataset.dataUrl = e.target.result;
    preview.innerHTML = `<img src="${e.target.result}" class="preview-img">`;
  };
  reader.readAsDataURL(file);
}

function renderPostCard(post, showActions = true) {
  const user = getUserById(post.userId);
  if (!user) return '';
  const liked = currentUser ? isLiked(post.id, currentUser.id) : false;
  const likeCount = getLikeCount(post.id);
  const commentCount = getCommentCount(post.id);
  const isOwner = currentUser && currentUser.id === post.userId;

  return `
    <div class="post-card">
      <div class="post-card-inner">
        <a href="#/users/${user.id}" class="avatar-link">${getAvatarHtml(user, 44)}</a>
        <div class="post-content">
          <div class="post-meta">
            <a href="#/users/${user.id}" class="display-name">${escapeHtml(user.displayName)}</a>
            <span class="post-time">${formatRelativeTime(post.createdAt)}</span>
            ${post.updatedAt !== post.createdAt ? '<span class="edited-badge">編集済み</span>' : ''}
          </div>
          <a href="#/posts/${post.id}" class="post-text-link">
            <p class="post-text">${escapeHtml(post.content)}</p>
          </a>
          ${post.imageUrl ? `<img src="${post.imageUrl}" class="post-image">` : ''}
          <div class="post-actions">
            <button class="action-btn like-btn ${liked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
              ${liked ? '❤️' : '🤍'} <span>${likeCount}</span>
            </button>
            <a href="#/posts/${post.id}" class="action-btn">💬 <span>${commentCount}</span></a>
            ${showActions && isOwner ? `
              <button class="action-btn" onclick="openEditPostModal(${post.id})">✏️ 編集</button>
              <button class="action-btn danger-btn" onclick="openDeleteDialog('post',${post.id},()=>{deletePost(${post.id})})">🗑️ 削除</button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>`;
}

function toggleLike(postId) {
  if (!currentUser) return;
  const idx = likes.findIndex(l => l.postId === postId && l.userId === currentUser.id);
  if (idx === -1) {
    likes.push({ id: nextLikeId++, postId, userId: currentUser.id });
  } else {
    likes.splice(idx, 1);
  }
  const hash = location.hash;
  if (hash === '#/' || hash === '') renderTimeline();
  else if (hash.startsWith('#/posts/')) renderPostDetail(postId);
  else if (hash.startsWith('#/users/')) {
    const m = hash.match(/^#\/users\/(\d+)$/);
    if (m) renderProfile(Number(m[1]));
  }
}

function deletePost(postId) {
  const idx = posts.findIndex(p => p.id === postId);
  if (idx !== -1) posts.splice(idx, 1);
  location.hash = '#/';
}
