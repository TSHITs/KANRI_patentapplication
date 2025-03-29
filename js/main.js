// グローバル変数
let cases = [];
let selectedCaseIds = []; // 複数選択のための配列
const today = new Date();

// DOM要素
const caseList = document.getElementById('caseList');
const createCaseBtn = document.getElementById('createCaseBtn');
const createCaseModal = document.getElementById('createCaseModal');
const createCaseForm = document.getElementById('createCaseForm');
const closeBtn = document.querySelector('.close-btn');
const searchInput = document.getElementById('searchInput');
const deleteCaseBtn = document.getElementById('deleteCaseBtn');
const deleteCaseModal = document.getElementById('deleteCaseModal');
const closeDeleteBtn = document.querySelector('.close-delete-btn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const selectedCaseInfo = document.querySelector('.selected-case-info');
const toggleDeletedCasesBtn = document.getElementById('toggleDeletedCasesBtn');
const deletedCasesSection = document.getElementById('deletedCasesSection');
const deletedCaseList = document.getElementById('deletedCaseList');

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', init);

function init() {
    // ローカルストレージから先に読み込む
    const savedCases = loadInitialData();
    if (savedCases) {
        cases = savedCases;
        displayCases(cases);
    } else {
        // ローカルストレージにデータがない場合はJSONファイルから読み込む
        loadCases();
    }
    setupEventListeners();
    
    // 削除済み案件データを読み込む
    loadDeletedCases();
}

// 案件データの読み込み
function loadCases() {
    fetch('data/cases.json')
        .then(response => response.json())
        .then(data => {
            cases = data;
            displayCases(cases);
        })
        .catch(error => {
            console.error('案件データの読み込みに失敗しました:', error);
            // エラーの場合、空の配列で初期化
            cases = [];
            displayCases(cases);
        });
}

// 案件一覧の表示
function displayCases(casesToDisplay) {
    caseList.innerHTML = '';
    
    if (casesToDisplay.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="5" style="text-align: center;">案件がありません</td>`;
        caseList.appendChild(emptyRow);
        return;
    }
    
    casesToDisplay.forEach(caseItem => {
        const row = document.createElement('tr');
        row.className = 'case-row';
        row.setAttribute('data-id', caseItem.id);
        
        // 出願目標期日の処理
        const targetDate = new Date(caseItem.targetDate);
        const daysUntilTarget = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
        
        // 期限に応じたスタイルの適用
        if (daysUntilTarget <= 2 && daysUntilTarget >= 0) {
            row.classList.add('danger');
        } else if (daysUntilTarget <= 7 && daysUntilTarget > 2) {
            row.classList.add('warning');
        }
        
        // ステータスの文字列を作成
        let statusText = 'まだ情報がありません';
        if (caseItem.status && caseItem.status.length > 0) {
            statusText = `最新: ${caseItem.status[caseItem.status.length - 1].date}`;
        }
        
        row.innerHTML = `
            <td><input type="checkbox" class="case-checkbox" data-id="${caseItem.id}"></td>
            <td>${caseItem.caseNumber}</td>
            <td>${caseItem.title}</td>
            <td>${formatDate(caseItem.targetDate)}</td>
            <td>${statusText}</td>
        `;
        
        caseList.appendChild(row);
    });
    
    // 案件行のクリックイベント
    document.querySelectorAll('.case-row').forEach(row => {
        // チェックボックス以外の部分をクリックしたときの処理
        row.addEventListener('click', (event) => {
            // チェックボックス自体のクリックは無視（チェックボックスのイベントは別で処理）
            if (event.target.classList.contains('case-checkbox')) {
                return;
            }
            
            // 詳細ページへ遷移
            const caseId = row.getAttribute('data-id');
            window.location.href = `case-detail.html?id=${caseId}`;
        });
    });
    
    // チェックボックスのクリックイベント
    document.querySelectorAll('.case-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', (event) => {
            event.stopPropagation(); // 親要素へのイベント伝播を停止
            const caseId = checkbox.getAttribute('data-id');
            handleCaseSelection(caseId, checkbox.checked);
        });
    });
}

// 案件選択の処理
function handleCaseSelection(caseId, isChecked) {
    if (isChecked) {
        // 選択されたケースIDを配列に追加
        if (!selectedCaseIds.includes(caseId)) {
            selectedCaseIds.push(caseId);
        }
    } else {
        // 選択解除されたケースIDを配列から削除
        selectedCaseIds = selectedCaseIds.filter(id => id !== caseId);
    }
    
    // 選択状態に応じて削除ボタンの有効/無効を切り替え
    if (selectedCaseIds.length > 0) {
        deleteCaseBtn.disabled = false;
        deleteCaseBtn.textContent = `選択案件削除 (${selectedCaseIds.length})`;
    } else {
        deleteCaseBtn.disabled = true;
        deleteCaseBtn.textContent = '選択案件削除';
    }
}

// 案件削除の処理
function deleteCase() {
    if (selectedCaseIds.length === 0) return;
    
    const deletedCases = [];
    const remainingCases = [];
    
    // 削除対象の案件と残す案件を分ける
    cases.forEach(caseItem => {
        if (selectedCaseIds.includes(caseItem.id.toString())) {
            // 削除フラグと削除日時を追加
            caseItem.deleted = true;
            caseItem.deletedAt = new Date().toISOString();
            deletedCases.push(caseItem);
        } else {
            remainingCases.push(caseItem);
        }
    });
    
    // 削除済み案件をローカルストレージに保存
    saveDeletedCases(deletedCases);
    
    // アクティブな案件リストを更新
    cases = remainingCases;
    saveCases();
    
    // 選択状態をリセット
    selectedCaseIds = [];
    deleteCaseBtn.disabled = true;
    deleteCaseBtn.textContent = '選択案件削除';
    
    // 案件一覧を更新して表示
    displayCases(cases);
    
    // モーダルを閉じる
    deleteCaseModal.style.display = 'none';
}

// 削除済み案件の保存
function saveDeletedCases(newlyDeletedCases) {
    // 以前に削除した案件を取得
    const savedDeletedCases = localStorage.getItem('patentDeletedCases');
    let deletedCases = [];
    
    if (savedDeletedCases) {
        deletedCases = JSON.parse(savedDeletedCases);
    }
    
    // 新しく削除した案件を追加
    deletedCases = [...deletedCases, ...newlyDeletedCases];
    
    // ローカルストレージに保存
    localStorage.setItem('patentDeletedCases', JSON.stringify(deletedCases));
}

// 案件データの保存
function saveCases() {
    // 実際のアプリケーションではサーバーに保存するが、このデモではローカルストレージを使用
    localStorage.setItem('patentCases', JSON.stringify(cases));
}

// 日付のフォーマット
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
}

// 案件データの初回読み込み時に、ローカルストレージからデータを復元
function loadInitialData() {
    const savedCases = localStorage.getItem('patentCases');
    if (savedCases) {
        return JSON.parse(savedCases);
    }
    return null;
}

// 削除済み案件の表示
function displayDeletedCases(deletedCases) {
    if (!deletedCaseList) return;
    
    deletedCaseList.innerHTML = '';
    
    if (deletedCases.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="4" style="text-align: center;">削除済み案件はありません</td>`;
        deletedCaseList.appendChild(emptyRow);
        return;
    }
    
    // 削除日時の新しい順にソート
    deletedCases.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
    
    deletedCases.forEach(caseItem => {
        const row = document.createElement('tr');
        
        // ステータスの文字列を作成
        let statusText = 'まだ情報がありません';
        if (caseItem.status && caseItem.status.length > 0) {
            statusText = `最終: ${caseItem.status[caseItem.status.length - 1].date}`;
        }
        
        // 削除日時のフォーマット
        const deletedDate = new Date(caseItem.deletedAt);
        const formattedDeletedDate = formatDateTime(deletedDate);
        
        row.innerHTML = `
            <td>${caseItem.caseNumber}</td>
            <td>${caseItem.title}</td>
            <td class="deleted-date">${formattedDeletedDate}</td>
            <td>${statusText}</td>
        `;
        
        deletedCaseList.appendChild(row);
    });
}

// 削除済み案件データの読み込み
function loadDeletedCases() {
    const savedDeletedCases = localStorage.getItem('patentDeletedCases');
    
    if (savedDeletedCases) {
        const deletedCases = JSON.parse(savedDeletedCases);
        displayDeletedCases(deletedCases);
    } else {
        displayDeletedCases([]);
    }
}

// 日時のフォーマット (日付と時刻)
function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

// イベントリスナーの設定
function setupEventListeners() {
    // 新規案件作成ボタン
    createCaseBtn.addEventListener('click', () => {
        createCaseModal.style.display = 'block';
    });
    
    // 案件削除ボタン
    deleteCaseBtn.addEventListener('click', () => {
        if (selectedCaseIds.length === 0) return;
        
        // 選択された案件の情報を取得
        let selectedCasesInfo = '';
        selectedCaseIds.forEach(id => {
            const selectedCase = cases.find(c => c.id == id);
            if (selectedCase) {
                selectedCasesInfo += `<li>案件番号: ${selectedCase.caseNumber}, 発明名称: ${selectedCase.title}</li>`;
            }
        });
        
        if (selectedCasesInfo) {
            // 確認メッセージを表示
            document.querySelector('.confirmation-message').textContent = `選択された ${selectedCaseIds.length} 件の案件を削除してもよろしいですか？`;
            selectedCaseInfo.innerHTML = `<ul>${selectedCasesInfo}</ul>`;
            document.querySelector('.warning-message').textContent = `※削除された案件はアクティブな一覧から除外されますが、ローカルストレージに保存されます`;
            deleteCaseModal.style.display = 'block';
        }
    });
    
    // 削除確認ボタン
    confirmDeleteBtn.addEventListener('click', deleteCase);
    
    // 削除キャンセルボタン
    cancelDeleteBtn.addEventListener('click', () => {
        deleteCaseModal.style.display = 'none';
    });
    
    // 削除モーダルを閉じるボタン
    if (closeDeleteBtn) {
        closeDeleteBtn.addEventListener('click', () => {
            deleteCaseModal.style.display = 'none';
        });
    }
    
    // モーダルを閉じる
    closeBtn.addEventListener('click', () => {
        createCaseModal.style.display = 'none';
    });
    
    // 背景クリックでモーダルを閉じる
    window.addEventListener('click', (event) => {
        if (event.target === createCaseModal) {
            createCaseModal.style.display = 'none';
        }
    });
    
    // 案件作成フォームの送信
    createCaseForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const caseNumber = document.getElementById('caseNumber').value;
        const caseTitle = document.getElementById('caseTitle').value;
        const targetDate = document.getElementById('targetDate').value;
        
        // 新しい案件の作成
        const newCase = {
            id: cases.length > 0 ? Math.max(...cases.map(c => c.id)) + 1 : 1,
            caseNumber: caseNumber,
            title: caseTitle,
            targetDate: targetDate,
            status: []
        };
        
        // 案件の追加
        cases.push(newCase);
        saveCases();
        displayCases(cases);
        
        // フォームのリセットとモーダルを閉じる
        createCaseForm.reset();
        createCaseModal.style.display = 'none';
    });
    
    // 検索機能
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        
        const filteredCases = cases.filter(caseItem => 
            caseItem.caseNumber.toLowerCase().includes(searchTerm) ||
            caseItem.title.toLowerCase().includes(searchTerm)
        );
        
        displayCases(filteredCases);
    });
    
    // 削除済み案件の表示/非表示トグル
    toggleDeletedCasesBtn.addEventListener('click', () => {
        const isVisible = deletedCasesSection.style.display !== 'none';
        
        if (isVisible) {
            deletedCasesSection.style.display = 'none';
            toggleDeletedCasesBtn.innerHTML = '<i class="fas fa-eye"></i> 表示';
        } else {
            deletedCasesSection.style.display = 'block';
            toggleDeletedCasesBtn.innerHTML = '<i class="fas fa-eye-slash"></i> 非表示';
            
            // 削除済み案件データを最新の状態に更新
            loadDeletedCases();
        }
    });
}
