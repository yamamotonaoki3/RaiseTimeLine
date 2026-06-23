// ─── S-05 プロフィール画面 ────────────────────────────────────────

function renderProfile(userId) {
  const user = getUserById(userId);
  if (!user) {
    document.getElementById('app').innerHTML = `${renderNav()}<main class="main"><div class="container"><p class="empty-msg">ユーザーが見つかりません。</p></div></main>`;
    return;
  }

  const isMe = currentUser && currentUser.id === userId;
  const following = !isMe && currentUser ? isFollowing(currentUser.id, userId) : false;
  const followerCount = getFollowerCount(userId);
  const followingCount = getFollowingCount(userId);
  const userPosts = getPostsByUserId(userId);

  const followBtn = !isMe && currentUser ? `
    <button class="btn ${following ? 'btn-ghost' : 'btn-primary'}" onclick="toggleFollow(${userId})">
      ${following ? 'アンフォロー' : 'フォロー'}
    </button>` : '';

  const editBtn = isMe ? `
    <button class="btn btn-ghost" onclick="openEditProfileModal()">✏️ プロフィールを編集</button>` : '';

  const postCards = userPosts.map(p => renderPostCard(p, isMe)).join('') ||
    '<p class="empty-msg">投稿がまだありません。</p>';

  document.getElementById('app').innerHTML = `
    ${renderNav()}
    <main class="main">
      <div class="container">
        <div style="margin-bottom:12px;">
          <a href="#/" class="btn btn-ghost btn-sm">← 戻る</a>
        </div>
        <div class="card profile-card">
          <div class="profile-header">
            ${getAvatarHtml(user, 72)}
            <div class="profile-info">
              <h2 class="profile-name">${escapeHtml(user.displayName)}</h2>
              <p class="profile-bio">${escapeHtml(user.bio || '自己紹介はまだありません')}</p>
              <div class="profile-stats">
                <a href="#/users/${userId}/following" class="stat-link">
                  <span class="stat-num">${followingCount}</span> フォロー中
                </a>
                <a href="#/users/${userId}/followers" class="stat-link">
                  <span class="stat-num">${followerCount}</span> フォロワー
                </a>
              </div>
              <div style="margin-top:12px;display:flex;gap:8px;">
                ${followBtn}
                ${editBtn}
              </div>
            </div>
          </div>
        </div>
        <div style="margin-top:16px;">
          <h3 style="padding:0 4px;margin-bottom:8px;">投稿一覧</h3>
          ${postCards}
        </div>
      </div>
    </main>`;
}

function toggleFollow(targetUserId) {
  if (!currentUser || currentUser.id === targetUserId) return;
  const idx = follows.findIndex(f => f.followerId === currentUser.id && f.followeeId === targetUserId);
  if (idx === -1) {
    follows.push({ id: nextFollowId++, followerId: currentUser.id, followeeId: targetUserId });
  } else {
    follows.splice(idx, 1);
  }
  renderProfile(targetUserId);
}

// ─── S-09 フォロー/フォロワー一覧画面 ────────────────────────────

function renderFollowList(userId, mode) {
  const user = getUserById(userId);
  if (!user) {
    document.getElementById('app').innerHTML = `${renderNav()}<main class="main"><div class="container"><p class="empty-msg">ユーザーが見つかりません。</p></div></main>`;
    return;
  }

  const list = mode === 'followers' ? getFollowers(userId) : getFollowing(userId);
  const followerCount = getFollowerCount(userId);
  const followingCount = getFollowingCount(userId);

  const userCards = list.map(u => {
    const isMe = currentUser && currentUser.id === u.id;
    const following = !isMe && currentUser ? isFollowing(currentUser.id, u.id) : false;
    return `
      <div class="card" style="display:flex;align-items:center;gap:12px;padding:12px 16px;margin-bottom:8px;">
        <a href="#/users/${u.id}">${getAvatarHtml(u, 44)}</a>
        <div style="flex:1;">
          <a href="#/users/${u.id}" class="display-name">${escapeHtml(u.displayName)}</a>
          <p style="color:#666;font-size:13px;margin-top:2px;">${escapeHtml(u.bio || '')}</p>
        </div>
        ${!isMe && currentUser ? `
          <button class="btn btn-sm ${following ? 'btn-ghost' : 'btn-primary'}" onclick="toggleFollowInList(${u.id},${userId},'${mode}')">
            ${following ? 'アンフォロー' : 'フォロー'}
          </button>` : ''}
      </div>`;
  }).join('') || '<p class="empty-msg">まだいません。</p>';

  document.getElementById('app').innerHTML = `
    ${renderNav()}
    <main class="main">
      <div class="container">
        <div style="margin-bottom:12px;">
          <a href="#/users/${userId}" class="btn btn-ghost btn-sm">← ${escapeHtml(user.displayName)} さんのプロフィールに戻る</a>
        </div>
        <div class="tabs">
          <a href="#/users/${userId}/followers" class="tab-btn ${mode === 'followers' ? 'active' : ''}">
            フォロワー (${followerCount})
          </a>
          <a href="#/users/${userId}/following" class="tab-btn ${mode === 'following' ? 'active' : ''}">
            フォロー中 (${followingCount})
          </a>
        </div>
        <div style="margin-top:16px;">${userCards}</div>
      </div>
    </main>`;
}

function toggleFollowInList(targetUserId, pageUserId, mode) {
  if (!currentUser || currentUser.id === targetUserId) return;
  const idx = follows.findIndex(f => f.followerId === currentUser.id && f.followeeId === targetUserId);
  if (idx === -1) {
    follows.push({ id: nextFollowId++, followerId: currentUser.id, followeeId: targetUserId });
  } else {
    follows.splice(idx, 1);
  }
  renderFollowList(pageUserId, mode);
}
