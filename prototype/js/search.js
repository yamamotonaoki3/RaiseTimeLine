// ─── S-06 ユーザー検索画面 ────────────────────────────────────────

function renderSearch() {
  document.getElementById('app').innerHTML = `
    ${renderNav()}
    <main class="main">
      <div class="container">
        <h2 style="margin-bottom:16px;">ユーザー検索</h2>
        <div style="margin-bottom:16px;">
          <input type="text" id="search-input" class="input" placeholder="表示名で検索..."
            oninput="execSearch()" autofocus>
        </div>
        <div id="search-results"><p class="empty-msg">表示名で検索してください。</p></div>
      </div>
    </main>`;
}

function execSearch() {
  const keyword = document.getElementById('search-input').value.trim().toLowerCase();
  const resultEl = document.getElementById('search-results');

  if (!keyword) {
    resultEl.innerHTML = '<p class="empty-msg">表示名で検索してください。</p>';
    return;
  }

  const results = users.filter(u =>
    u.id !== currentUser.id &&
    (u.displayName.toLowerCase().includes(keyword) ||
     (u.yomi && u.yomi.includes(keyword)))
  );

  if (results.length === 0) {
    resultEl.innerHTML = '<p class="empty-msg">ユーザーが見つかりませんでした。</p>';
    return;
  }

  resultEl.innerHTML = results.map(u => {
    const following = isFollowing(currentUser.id, u.id);
    return `
      <div class="card" style="display:flex;align-items:center;gap:12px;padding:12px 16px;margin-bottom:8px;">
        <a href="#/users/${u.id}">${getAvatarHtml(u, 44)}</a>
        <div style="flex:1;">
          <a href="#/users/${u.id}" class="display-name">${escapeHtml(u.displayName)}</a>
          <p style="color:#666;font-size:13px;margin-top:2px;">${escapeHtml(u.bio || '')}</p>
        </div>
        <button class="btn btn-sm ${following ? 'btn-ghost' : 'btn-primary'}" onclick="toggleFollowSearch(${u.id})">
          ${following ? 'アンフォロー' : 'フォロー'}
        </button>
      </div>`;
  }).join('');
}

function toggleFollowSearch(targetUserId) {
  if (!currentUser) return;
  const idx = follows.findIndex(f => f.followerId === currentUser.id && f.followeeId === targetUserId);
  if (idx === -1) {
    follows.push({ id: nextFollowId++, followerId: currentUser.id, followeeId: targetUserId });
  } else {
    follows.splice(idx, 1);
  }
  execSearch();
}
