// グローバル変数
let currentCase = null;

// DOM要素
const caseTitle = document.getElementById('caseTitle');
const caseNumber = document.getElementById('caseNumber');
const targetDate = document.getElementById('targetDate');
const statusHistory = document.getElementById('statusHistory');
const noStatus = document.getElementById('noStatus');
const editDateBtn = document.getElementById('editDateBtn');
const editDateModal = document.getElementById('editDateModal');
const editDateForm = document.getElementById('editDateForm');
const newTargetDate = document.getElementById('newTargetDate');
const closeBtn = document.querySelector('.close-btn');
const usernameElement = document.getElementById('username');
const logoutBtn = document.getElementById('logoutBtn');

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', init);

function init() {
    // 認証チェック - 未ログインならログインページへリダイレクト
    if (!checkAuth()) return;
    
    // ユーザー情報を表示
    displayUserInfo();
    
    // URLパラメータから案件IDを取得
    const urlParams = new URLSearchParams(window.location.search);
    const caseId = urlParams.get('id');
    
    if (caseId) {
        loadCaseDetails(caseId);
        setupEventListeners();
    } else {
        // IDが指定されていない場合、一覧に戻る
        window.location.href = 'index.html';
    }
}

// ユーザー情報の表示
function displayUserInfo() {
    if (usernameElement) {
        usernameElement.textContent = getUsername();
    }
}

// 案件詳細の読み込み
function loadCaseDetails(caseId) {
    // まずローカルストレージから案件データを読み込む
    const savedCases = localStorage.getItem('patentCases');
    
    if (savedCases) {
        const cases = JSON.parse(savedCases);
        // 案件IDで検索
        currentCase = cases.find(c => c.id == caseId);
        
        if (currentCase) {
            displayCaseDetails();
            return;
        }
    }
    
    // ローカルストレージに案件がない場合、JSONファイルから読み込む
    fetch('data/cases.json')
        .then(response => response.json())
        .then(cases => {
            // 案件IDで検索
            currentCase = cases.find(c => c.id == caseId);
            
            if (currentCase) {
                displayCaseDetails();
            } else {
                // 案件が見つからない場合、一覧に戻る
                window.location.href = 'index.html';
            }
        })
        .catch(error => {
            console.error('案件データの読み込みに失敗しました:', error);
            // エラーの場合、一覧に戻る
            window.location.href = 'index.html';
        });
}

// 案件詳細の表示
function displayCaseDetails() {
    // 基本情報の表示
    caseTitle.textContent = currentCase.title;
    caseNumber.textContent = currentCase.caseNumber;
    targetDate.textContent = formatDate(currentCase.targetDate);
    
    // ステータス履歴の表示
    if (currentCase.status && currentCase.status.length > 0) {
        noStatus.style.display = 'none';
        
        // ステータス履歴をクリア
        statusHistory.innerHTML = '';
        
        // 新しいものから表示するため、配列を反転
        const reversedStatus = [...currentCase.status].reverse();
        
        reversedStatus.forEach(status => {
            const statusItem = document.createElement('div');
            statusItem.className = 'status-item';
            
            statusItem.innerHTML = `
                <div class="status-meta">
                    <span class="status-date">${formatDate(status.date)}</span>
                </div>
                <div class="status-participants">
                    <strong>送信者:</strong> ${status.sender} → <strong>受信者:</strong> ${status.receiver}
                </div>
                <div class="status-summary">
                    ${status.summary}
                </div>
            `;
            
            statusHistory.appendChild(statusItem);
        });
    } else {
        noStatus.style.display = 'block';
    }
    
    // 初期値として現在の期日をセット
    newTargetDate.value = currentCase.targetDate;
}

// イベントリスナーの設定
function setupEventListeners() {
    // ログアウトボタン
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // 期日修正ボタン
    editDateBtn.addEventListener('click', () => {
        editDateModal.style.display = 'block';
    });
    
    // モーダルを閉じる
    closeBtn.addEventListener('click', () => {
        editDateModal.style.display = 'none';
    });
    
    // 背景クリックでモーダルを閉じる
    window.addEventListener('click', (event) => {
        if (event.target === editDateModal) {
            editDateModal.style.display = 'none';
        }
    });
    
    // 期日修正フォームの送信
    editDateForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        // 期日の更新
        currentCase.targetDate = newTargetDate.value;
        
        // 更新を保存
        saveCaseUpdate();
        
        // 表示を更新
        targetDate.textContent = formatDate(currentCase.targetDate);
        
        // モーダルを閉じる
        editDateModal.style.display = 'none';
    });
}

// 案件データの更新保存
function saveCaseUpdate() {
    // 実際のアプリケーションではサーバーに保存するが、このデモではローカルストレージを使用
    fetch('data/cases.json')
        .then(response => response.json())
        .then(cases => {
            // 現在の案件を更新
            const index = cases.findIndex(c => c.id === currentCase.id);
            if (index !== -1) {
                cases[index] = currentCase;
                localStorage.setItem('patentCases', JSON.stringify(cases));
            }
        })
        .catch(error => {
            console.error('案件データの更新に失敗しました:', error);
        });
}

// 日付のフォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
}

// 認証チェック
function checkAuth() {
    // ローカルストレージからユーザー情報を取得
    const user = localStorage.getItem('user');
    
    if (!user) {
        // 未ログインの場合、ログインページへリダイレクト
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// ユーザー名の取得
function getUsername() {
    const user = localStorage.getItem('user');
    return JSON.parse(user).username;
}

// ログアウト処理
function logout() {
    // ローカルストレージからユーザー情報を削除
    localStorage.removeItem('user');
    
    // ログインページへリダイレクト
    window.location.href = 'login.html';
}
