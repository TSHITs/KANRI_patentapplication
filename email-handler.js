/**
 * メール処理機能モジュール
 * [BDM####]形式の社内管理番号を含み、@ip-healthcare.comがToまたはCCに含まれるメールを処理
 */

// 設定
const API_BASE_URL = 'https://patent-api.onrender.com/api'; // 実際のバックエンドAPIエンドポイント
const MOCK_ENABLED = false; // 開発中はモックデータを使用（実際の実装時はfalseに変更）

// グローバル変数
let currentBdmCode = '';
let authToken = '';

// 初期化処理
function initEmailHandler() {
    // メール更新ボタンにイベントリスナーを設定
    const refreshEmailsBtn = document.getElementById('refreshEmailsBtn');
    if (refreshEmailsBtn) {
        refreshEmailsBtn.addEventListener('click', () => {
            fetchEmails();
        });
    }
    
    // ページ読み込み時に社内管理番号を取得し、メールを取得
    const caseNumberElement = document.getElementById('caseNumber');
    if (caseNumberElement && caseNumberElement.textContent) {
        // [BDM####]形式の社内管理番号を抽出
        const bdmMatch = caseNumberElement.textContent.match(/BDM\d{4}/i);
        if (bdmMatch) {
            currentBdmCode = bdmMatch[0].toUpperCase();
            
            // トークンの確認
            checkAuthToken();
        }
    }
}

// 認証トークンのチェック
function checkAuthToken() {
    // ローカルストレージからトークンを取得
    authToken = localStorage.getItem('graphApiToken');
    
    // URLからトークンを取得（認証後のリダイレクト時）
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
        // URLからトークンを取得した場合、保存して使用
        authToken = tokenFromUrl;
        localStorage.setItem('graphApiToken', authToken);
        
        // URLからトークンパラメータを削除（履歴には残る）
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }
    
    // トークンの有無に応じて処理
    if (authToken) {
        // トークンがある場合はメール取得
        fetchEmails();
    } else if (!MOCK_ENABLED) {
        // トークンがなく、モックモードでもない場合は認証を促す
        showAuthPrompt();
    } else {
        // モックモード有効時はモックデータを使用
        fetchEmails();
    }
}

// 認証プロンプトの表示
function showAuthPrompt() {
    const emailContainer = document.getElementById('emailContainer');
    if (emailContainer) {
        emailContainer.innerHTML = `
            <div class="auth-prompt">
                <p>Microsoftアカウントとの連携が必要です</p>
                <button id="authBtn" class="primary-btn">
                    <i class="fab fa-microsoft"></i> Microsoftで認証
                </button>
            </div>
        `;
        
        // 認証ボタンにイベントリスナーを設定
        const authBtn = document.getElementById('authBtn');
        if (authBtn) {
            authBtn.addEventListener('click', startAuth);
        }
    }
}

// 認証プロセスの開始
function startAuth() {
    // バックエンドの認証エンドポイントにリダイレクト
    window.location.href = `${API_BASE_URL.replace('/api', '')}/auth/login`;
}

// メールを取得
async function fetchEmails() {
    if (!currentBdmCode && !MOCK_ENABLED) {
        showNoEmails('有効な社内管理番号が見つかりません');
        return;
    }
    
    // ローディング表示
    showLoading(true);
    showNoEmails('');
    
    try {
        let emails;
        
        if (MOCK_ENABLED) {
            // 開発用モックデータ
            emails = await getMockEmails();
        } else {
            // 本番用API呼び出し
            const response = await fetch(
                `${API_BASE_URL}/emails/bdm-emails?bdmCode=${currentBdmCode}`,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                }
            );
            
            if (response.status === 401) {
                // 認証切れの場合
                localStorage.removeItem('graphApiToken');
                showAuthPrompt();
                return;
            }
            
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            
            const data = await response.json();
            emails = data.emails || [];
        }
        
        // メール表示
        displayEmails(emails);
    } catch (error) {
        console.error('メール取得エラー:', error);
        showNoEmails(`メールの取得中にエラーが発生しました: ${error.message}`);
    } finally {
        // ローディング非表示
        showLoading(false);
    }
}

// メールの表示
function displayEmails(emails) {
    const emailList = document.getElementById('emailList');
    const noEmails = document.getElementById('noEmails');
    
    // メールリストをクリア
    emailList.innerHTML = '';
    
    if (!emails || emails.length === 0) {
        showNoEmails('この案件に関連するメールはありません');
        return;
    }
    
    // メールがある場合、noEmailsを非表示
    noEmails.style.display = 'none';
    emailList.style.display = 'block';
    
    // メールを日付の新しい順にソート
    const sortedEmails = [...emails].sort((a, b) => 
        new Date(b.receivedDateTime) - new Date(a.receivedDateTime)
    );
    
    // メール項目を生成して表示
    sortedEmails.forEach(email => {
        const emailItem = createEmailItem(email);
        emailList.appendChild(emailItem);
    });
}

// メール項目要素の生成
function createEmailItem(email) {
    const emailItem = document.createElement('div');
    emailItem.className = 'email-item';
    
    // 日付のフォーマット
    const date = new Date(email.receivedDateTime);
    const formattedDate = formatDate(date);
    
    // 送信者情報
    const sender = email.sender;
    const senderName = sender.name || sender.address;
    const senderAddress = sender.address;
    
    // 受信者情報
    const recipients = email.recipients || {};
    const toRecipients = recipients.to || [];
    const ccRecipients = recipients.cc || [];
    
    // 受信者文字列生成
    const toRecipientsStr = toRecipients
        .map(r => r.name ? `${r.name} (${r.address})` : r.address)
        .join(', ');
    
    const ccRecipientsStr = ccRecipients.length > 0 
        ? ccRecipients
            .map(r => r.name ? `${r.name} (${r.address})` : r.address)
            .join(', ')
        : '';
    
    emailItem.innerHTML = `
        <div class="email-header">
            <div class="email-subject">${sanitizeHTML(email.subject)}</div>
            <div class="email-date">${formattedDate}</div>
        </div>
        <div class="email-sender">
            <strong>From:</strong> <span>${sanitizeHTML(senderName)}</span> &lt;${sanitizeHTML(senderAddress)}&gt;
        </div>
        <div class="email-recipients">
            <strong>To:</strong> <span>${sanitizeHTML(toRecipientsStr)}</span>
            ${ccRecipientsStr ? `<br><strong>Cc:</strong> <span>${sanitizeHTML(ccRecipientsStr)}</span>` : ''}
        </div>
        <div class="email-summary-container">
            <div class="email-summary-title">【要約】</div>
            <div class="email-summary-content">${sanitizeHTML(email.summary)}</div>
        </div>
        ${email.hasAttachments ? `
        <div class="email-attachments">
            <i class="fas fa-paperclip"></i> 添付ファイルあり
        </div>` : ''}
    `;
    
    return emailItem;
}

// ローディング表示の切り替え
function showLoading(show) {
    const loading = document.getElementById('emailLoading');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

// メールなし表示
function showNoEmails(message) {
    const noEmails = document.getElementById('noEmails');
    const emailList = document.getElementById('emailList');
    
    if (noEmails) {
        if (message) {
            noEmails.innerHTML = `<p>${message}</p>`;
            noEmails.style.display = 'block';
            if (emailList) emailList.style.display = 'none';
        } else {
            noEmails.style.display = 'none';
        }
    }
}

// 日付のフォーマット
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

// HTML特殊文字のエスケープ（XSS対策）
function sanitizeHTML(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 開発用モックデータ取得
async function getMockEmails() {
    // 実際のAPIが完成するまでのモックデータ
    return [
        {
            id: 'email1',
            bdmCode: 'BDM0040',
            subject: '[BDM0040] 特許出願書類の確認依頼',
            summary: 'お世話になっております。添付の特許出願書類をご確認いただきたく存じます。特に請求項1〜3の記載内容と図面の対応についてご意見をいただければ幸いです。修正箇所がございましたら、来週火曜日までにご連絡ください。',
            receivedDateTime: '2025-03-27T14:30:00Z',
            sender: {
                name: '山田太郎',
                address: 'yamada@ip-healthcare.com'
            },
            recipients: {
                to: [
                    {
                        name: '佐藤一郎',
                        address: 'sato@ip-healthcare.com'
                    }
                ],
                cc: [
                    {
                        name: '鈴木花子',
                        address: 'suzuki@ip-healthcare.com'
                    },
                    {
                        name: '田中次郎',
                        address: 'tanaka@ip-healthcare.com'
                    }
                ]
            },
            hasAttachments: true
        },
        {
            id: 'email2',
            bdmCode: 'BDM0040',
            subject: 'Re: [BDM0040] 特許出願書類の確認依頼',
            summary: 'ご連絡ありがとうございます。書類を確認しました。請求項2については明細書の段落[0035]との整合性に問題があるように思います。また、図3と図4の参照符号に不一致がありました。詳細は添付のコメントをご確認ください。その他は問題ないと思います。',
            receivedDateTime: '2025-03-28T10:15:00Z',
            sender: {
                name: '佐藤一郎',
                address: 'sato@ip-healthcare.com'
            },
            recipients: {
                to: [
                    {
                        name: '山田太郎',
                        address: 'yamada@ip-healthcare.com'
                    }
                ],
                cc: [
                    {
                        name: '鈴木花子',
                        address: 'suzuki@ip-healthcare.com'
                    },
                    {
                        name: '田中次郎',
                        address: 'tanaka@ip-healthcare.com'
                    }
                ]
            },
            hasAttachments: true
        },
        {
            id: 'email3',
            bdmCode: 'BDM0040',
            subject: 'Re: [BDM0040] 特許出願書類の確認依頼 - 修正版',
            summary: 'お世話になっております。ご指摘いただいた箇所を修正いたしました。請求項2と段落[0035]の整合性を取るために内容を一部変更し、図面の参照符号も統一しました。最終確認をお願いいたします。',
            receivedDateTime: '2025-03-28T16:45:00Z',
            sender: {
                name: '山田太郎',
                address: 'yamada@ip-healthcare.com'
            },
            recipients: {
                to: [
                    {
                        name: '佐藤一郎',
                        address: 'sato@ip-healthcare.com'
                    }
                ],
                cc: [
                    {
                        name: '鈴木花子',
                        address: 'suzuki@ip-healthcare.com'
                    }
                ]
            },
            hasAttachments: true
        }
    ];
}

// DOMコンテンツ読み込み完了時に初期化
document.addEventListener('DOMContentLoaded', initEmailHandler);
