// メール送受信シミュレーター
// 特許出願管理システムのデモンストレーション用

// メールシミュレーションのためのグローバル変数
let emailCases = [];

// DOM要素
document.addEventListener('DOMContentLoaded', () => {
    // 必要なDOM要素の取得
    const emailSimContainer = document.getElementById('emailSimulator');
    const emailForm = document.getElementById('emailForm');
    const closeSimBtn = document.getElementById('closeSimBtn');

    // イベントリスナーのセットアップ
    if (emailForm) {
        emailForm.addEventListener('submit', handleEmailSubmit);
    }
    
    if (closeSimBtn) {
        closeSimBtn.addEventListener('click', () => {
            if (emailSimContainer) {
                emailSimContainer.style.display = 'none';
            }
        });
    }

    // 案件データを取得
    loadAllCases();
});

// 案件データの読み込み
function loadAllCases() {
    // ローカルストレージからデータを読み込む
    const savedCases = localStorage.getItem('patentCases');
    
    if (savedCases) {
        emailCases = JSON.parse(savedCases);
    } else {
        // ローカルストレージにデータがない場合はJSONファイルから読み込む
        fetch('data/cases.json')
            .then(response => response.json())
            .then(data => {
                emailCases = data;
            })
            .catch(error => {
                console.error('案件データの読み込みに失敗しました:', error);
                emailCases = [];
            });
    }
}

// メールフォーム送信処理
function handleEmailSubmit(event) {
    event.preventDefault();
    
    // フォームからデータを取得
    const caseNumber = document.getElementById('emailCaseNumber').value;
    const sender = document.getElementById('emailSender').value;
    const receiver = document.getElementById('emailReceiver').value;
    const subject = document.getElementById('emailSubject').value;
    const content = document.getElementById('emailContent').value;
    
    // 入力チェック
    if (!caseNumber || !sender || !receiver || !subject || !content) {
        alert('すべての項目を入力してください');
        return;
    }
    
    // 特許管理番号を持つ案件を検索
    const targetCase = emailCases.find(c => c.caseNumber === caseNumber);
    
    if (!targetCase) {
        alert(`案件番号 ${caseNumber} は見つかりませんでした`);
        return;
    }
    
    // メールドメインチェック（いずれかに@ip-healthcare.comを含むか）
    const isHealthcareInvolved = sender.includes('@ip-healthcare.com') || receiver.includes('@ip-healthcare.com');
    
    if (!isHealthcareInvolved) {
        alert('送信者または受信者のいずれかに@ip-healthcare.comドメインが含まれている必要があります');
        return;
    }
    
    // 新しいステータスレコードを作成
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const newStatus = {
        date: formattedDate,
        sender: sender,
        receiver: receiver,
        summary: `件名: ${subject} - ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`
    };
    
    // 案件のステータスを更新
    if (!targetCase.status) {
        targetCase.status = [];
    }
    
    targetCase.status.push(newStatus);
    
    // ローカルストレージに保存
    localStorage.setItem('patentCases', JSON.stringify(emailCases));
    
    // 処理完了メッセージ
    alert(`案件 ${caseNumber} にメール情報が記録されました。案件詳細画面で確認できます。`);
    
    // フォームをリセット
    document.getElementById('emailForm').reset();
    
    // シミュレーターを閉じる
    const emailSimContainer = document.getElementById('emailSimulator');
    if (emailSimContainer) {
        emailSimContainer.style.display = 'none';
    }
    
    // 現在のページが詳細ページの場合、表示を更新
    const urlParams = new URLSearchParams(window.location.search);
    const currentCaseId = urlParams.get('id');
    
    if (currentCaseId && Number(currentCaseId) === targetCase.id && window.location.href.includes('case-detail.html')) {
        window.location.reload();
    }
}

// メールシミュレーターを表示する関数（外部からも呼び出せるようグローバルに定義）
function showEmailSimulator() {
    const emailSimContainer = document.getElementById('emailSimulator');
    if (emailSimContainer) {
        emailSimContainer.style.display = 'block';
    }
}
