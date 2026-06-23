// ─── S-03 タイムライン画面 ────────────────────────────────────────

let timelineTab = 'following';

function renderTimeline() {
  const allPosts = timelineTab === 'following'
    ? getTimelineFollowing(currentUser.id)
    : getTimelineAll();

  const postCards = allPosts.length > 0
    ? allPosts.map(p => renderPostCard(p)).join('')
    : '<p class="empty-msg">投稿がありません。フォローを増やすか「全体」タブをご覧ください。</p>';

  document.getElementById('app').innerHTML = `
    ${renderNav()}
    <main class="main">
      <div class="container">
        <div class="card" style="margin-bottom:16px;padding:16px;display:flex;align-items:center;gap:12px;">
          ${getAvatarHtml(currentUser, 44)}
          <button class="btn btn-primary" style="flex:1;" onclick="openCreatePostModal()">✏️ 投稿する</button>
        </div>
        <div class="tabs">
          <button class="tab-btn ${timelineTab === 'following' ? 'active' : ''}" onclick="switchTab('following')">フォロー中</button>
          <button class="tab-btn ${timelineTab === 'all' ? 'active' : ''}" onclick="switchTab('all')">全体</button>
        </div>
        <div id="post-list">${postCards}</div>
      </div>
    </main>`;
}

function switchTab(tab) {
  timelineTab = tab;
  renderTimeline();
}
