// ─── ハッシュルーター ─────────────────────────────────────────────

function route() {
  if (!currentUser) {
    const hash = location.hash;
    if (hash !== '#/login' && hash !== '#/register') {
      location.hash = '#/login';
      return;
    }
  }

  const hash = location.hash || '#/';

  if (hash === '#/login') return renderLogin();
  if (hash === '#/register') return renderRegister();
  if (hash === '#/' || hash === '') return renderTimeline();
  if (hash === '#/search') return renderSearch();

  let m;

  m = hash.match(/^#\/posts\/(\d+)$/);
  if (m) return renderPostDetail(Number(m[1]));

  m = hash.match(/^#\/users\/(\d+)\/followers$/);
  if (m) return renderFollowList(Number(m[1]), 'followers');

  m = hash.match(/^#\/users\/(\d+)\/following$/);
  if (m) return renderFollowList(Number(m[1]), 'following');

  m = hash.match(/^#\/users\/(\d+)$/);
  if (m) return renderProfile(Number(m[1]));

  location.hash = '#/';
}

window.addEventListener('hashchange', route);
window.addEventListener('load', route);
