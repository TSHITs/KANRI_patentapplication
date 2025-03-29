// 認証状態を管理するユーティリティ

// ログイン状態のチェック
function checkAuth() {
    const user = localStorage.getItem('user');
    
    if (!user) {
        // ログインしていない場合はログインページにリダイレクト
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// ログアウト処理
function logout() {
    // ローカルストレージからログイン情報を削除
    localStorage.removeItem('user');
    
    // ログインページにリダイレクト
    window.location.href = 'login.html';
}

// ユーザー名を取得
function getUsername() {
    const user = localStorage.getItem('user');
    if (user) {
        return JSON.parse(user).username || 'ゲスト';
    }
    return 'ゲスト';
}

// ログイン日時を取得
function getLoginTime() {
    const user = localStorage.getItem('user');
    if (user) {
        const userData = JSON.parse(user);
        if (userData.loginTime) {
            return new Date(userData.loginTime);
        }
    }
    return null;
}
