// ─── S-04 投稿詳細・コメント画面 ──────────────────────────────────

function renderPostDetail(postId) {
  const post = getPostById(postId);
  if (!post) {
    document.getElementById('app').innerHTML = `${renderNav()}<main class="main"><div class="container"><p class="empty-msg">投稿が見つかりません。</p><a href="#/" class="btn btn-ghost">← ホームに戻る</a></div></main>`;
    return;
  }

  const postComments = getCommentsByPostId(postId);

  const commentItems = postComments.map(c => {
    const u = getUserById(c.userId);
    const isOwner = currentUser && currentUser.id === c.userId;
    return `
      <div class="comment-item">
        <a href="#/users/${u.id}">${getAvatarHtml(u, 36)}</a>
        <div class="comment-body">
          <div class="comment-meta">
            <a href="#/users/${u.id}" class="display-name">${escapeHtml(u.displayName)}</a>
            <span class="post-time">${formatRelativeTime(c.createdAt)}</span>
          </div>
          <p class="comment-text">${escapeHtml(c.content)}</p>
          ${isOwner ? `<button class="action-btn danger-btn" onclick="openDeleteDialog('comment',${c.id},()=>{deleteComment(${c.id},${postId})})">🗑️ 削除</button>` : ''}
        </div>
      </div>`;
  }).join('');

  document.getElementById('app').innerHTML = `
    ${renderNav()}
    <main class="main">
      <div class="container">
        <div style="margin-bottom:12px;">
          <a href="#/" class="btn btn-ghost btn-sm">← 戻る</a>
        </div>
        ${renderPostCard(post, true)}
        <div class="card" style="margin-top:16px;padding:16px;">
          <h3 style="margin-bottom:12px;">コメント</h3>
          <div style="display:flex;gap:12px;margin-bottom:16px;">
            ${getAvatarHtml(currentUser, 36)}
            <div style="flex:1;">
              <textarea id="comment-text" class="textarea" rows="2" maxlength="280" placeholder="コメントを入力..." oninput="updateCount('comment-text','comment-count',280)"></textarea>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
                <span class="char-count"><span id="comment-count">0</span>/280</span>
                <button class="btn btn-primary btn-sm" onclick="submitComment(${postId})">送信</button>
              </div>
              <div id="comment-error" class="error-msg" style="display:none;"></div>
            </div>
          </div>
          <div id="comment-list">
            ${commentItems || '<p class="empty-msg">コメントはまだありません。</p>'}
          </div>
        </div>
      </div>
    </main>`;
}

function submitComment(postId) {
  const text = document.getElementById('comment-text').value.trim();
  const errEl = document.getElementById('comment-error');
  if (!text || text.length > 280) {
    errEl.textContent = 'コメントは1〜280文字で入力してください';
    errEl.style.display = 'block';
    return;
  }
  comments.push({
    id: nextCommentId++,
    postId,
    userId: currentUser.id,
    content: text,
    createdAt: new Date().toISOString(),
  });
  renderPostDetail(postId);
}

function deleteComment(commentId, postId) {
  const idx = comments.findIndex(c => c.id === commentId);
  if (idx !== -1) comments.splice(idx, 1);
  renderPostDetail(postId);
}
