// ログイン認証を管理するモジュール
document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const emailForm = document.getElementById('emailForm');
    const codeForm = document.getElementById('codeForm');
    const emailInput = document.getElementById('email');
    const authCodeInput = document.getElementById('authCode');
    const emailError = document.getElementById('emailError');
    const codeError = document.getElementById('codeError');
    const emailDisplay = document.getElementById('emailDisplay');
    const emailFormContainer = document.getElementById('email-form-container');
    const codeFormContainer = document.getElementById('code-form-container');
    const backToEmailBtn = document.getElementById('backToEmailBtn');
    const codeDisplay = document.getElementById('code-display');
    const generatedCode = document.getElementById('generatedCode');
    
    // 変数
    let currentEmail = '';
    let verificationCode = '';
    
    // メールフォームの送信イベント
    emailForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        // @ip-healthcare.comドメインの確認
        if (!email.endsWith('@ip-healthcare.com')) {
            emailError.textContent = '@ip-healthcare.comドメインのメールアドレスを入力してください';
            return;
        }
        
        // 認証コードの生成と表示
        currentEmail = email;
        verificationCode = generateVerificationCode();
        
        // 実際のシステムではメール送信処理を行う
        // ここではデモ用に画面に表示
        emailDisplay.textContent = currentEmail;
        generatedCode.textContent = verificationCode;
        
        // フォームの切り替え
        emailFormContainer.style.display = 'none';
        codeFormContainer.style.display = 'block';
        codeDisplay.style.display = 'block';
        
        // エラーメッセージをクリア
        emailError.textContent = '';
        codeError.textContent = '';
    });
    
    // 認証コードフォームの送信イベント
    codeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const enteredCode = authCodeInput.value.trim();
        
        // 認証コードの確認
        if (enteredCode !== verificationCode) {
            codeError.textContent = '認証コードが正しくありません';
            return;
        }
        
        // 認証成功: ユーザー情報をローカルストレージに保存
        loginSuccess(currentEmail);
    });
    
    // メールフォームに戻るボタン
    backToEmailBtn.addEventListener('click', () => {
        emailFormContainer.style.display = 'block';
        codeFormContainer.style.display = 'none';
        codeDisplay.style.display = 'none';
        authCodeInput.value = '';
        codeError.textContent = '';
    });
    
    // 6桁の認証コードを生成
    function generateVerificationCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    // ログイン成功時の処理
    function loginSuccess(email) {
        // ログイン情報をローカルストレージに保存
        const userData = {
            username: email,
            loginTime: new Date().toISOString(),
            isLoggedIn: true
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        
        // メインページにリダイレクト
        window.location.href = 'index.html';
    }
    
    // ページ読み込み時に既にログイン済みかチェック
    function checkAlreadyLoggedIn() {
        const user = localStorage.getItem('user');
        
        if (user) {
            const userData = JSON.parse(user);
            if (userData.isLoggedIn) {
                // 既にログイン済みの場合はメインページへリダイレクト
                window.location.href = 'index.html';
            }
        }
    }
    
    // ページ読み込み時にログイン状態をチェック
    checkAlreadyLoggedIn();
});
