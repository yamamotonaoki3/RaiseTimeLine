// ─── S-01 ログイン画面 ────────────────────────────────────────────

function renderLogin() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h1 class="auth-logo">🐦 RaiseTimeLine</h1>
        <h2 class="auth-title">ログイン</h2>
        <div class="form-group">
          <label class="form-label">メールアドレス</label>
          <input type="email" id="login-email" class="input" placeholder="example@mail.com">
        </div>
        <div class="form-group">
          <label class="form-label">パスワード</label>
          <input type="password" id="login-password" class="input" placeholder="パスワード">
        </div>
        <div id="login-error" class="error-msg" style="display:none;"></div>
        <button class="btn btn-primary btn-full" onclick="submitLogin()">ログイン</button>
        <p class="auth-link">アカウントをお持ちでない方は <a href="#/register">登録はこちら</a></p>
        <p class="auth-hint">※ デモ: taro@example.com / password1</p>
      </div>
    </div>`;
}

function submitLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

  if (!email || !password) {
    errEl.textContent = 'メールアドレスとパスワードを入力してください';
    errEl.style.display = 'block';
    return;
  }

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    errEl.textContent = 'メールアドレスまたはパスワードが正しくありません';
    errEl.style.display = 'block';
    return;
  }

  currentUser = user;
  location.hash = '#/';
}

// ─── S-02 ユーザー登録画面 ────────────────────────────────────────

function renderRegister() {
  document.getElementById('app').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <h1 class="auth-logo">🐦 RaiseTimeLine</h1>
        <h2 class="auth-title">アカウント登録</h2>
        <div class="form-group">
          <label class="form-label">表示名 <span class="required">*</span></label>
          <input type="text" id="reg-name" class="input" maxlength="50" placeholder="表示名">
        </div>
        <div class="form-group">
          <label class="form-label">メールアドレス <span class="required">*</span></label>
          <input type="email" id="reg-email" class="input" placeholder="example@mail.com">
        </div>
        <div class="form-group">
          <label class="form-label">パスワード <span class="required">*</span>（8文字以上）</label>
          <input type="password" id="reg-password" class="input" placeholder="8文字以上">
        </div>
        <div id="reg-error" class="error-msg" style="display:none;"></div>
        <button class="btn btn-primary btn-full" onclick="submitRegister()">登録する</button>
        <p class="auth-link">既にアカウントをお持ちの方は <a href="#/login">ログインはこちら</a></p>
      </div>
    </div>`;
}

function submitRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errEl = document.getElementById('reg-error');

  if (!name || !email || !password) {
    errEl.textContent = '全ての項目を入力してください';
    errEl.style.display = 'block';
    return;
  }
  if (name.length > 50) {
    errEl.textContent = '表示名は50文字以内で入力してください';
    errEl.style.display = 'block';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.textContent = '正しいメールアドレスを入力してください';
    errEl.style.display = 'block';
    return;
  }
  if (password.length < 8) {
    errEl.textContent = 'パスワードは8文字以上で入力してください';
    errEl.style.display = 'block';
    return;
  }
  if (users.find(u => u.email === email)) {
    errEl.textContent = 'このメールアドレスは既に使用されています';
    errEl.style.display = 'block';
    return;
  }

  const newUser = {
    id: nextUserId++,
    displayName: name,
    email,
    password,
    avatarUrl: null,
    bio: '',
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  currentUser = newUser;
  location.hash = '#/';
}
