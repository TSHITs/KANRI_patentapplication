/**
 * 特許管理システム API サーバー
 * Microsoft Graph APIと連携して、特定のメール情報を処理するバックエンドサーバー
 */

// 環境変数の読み込み
require('dotenv').config({ path: '../.env' });

// 依存パッケージ
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// ルーターのインポート
const authRouter = require('./routes/auth-routes');
const emailRouter = require('./routes/email-routes');

// アプリケーション設定
const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:8000'];

// ミドルウェア
app.use(helmet()); // セキュリティ強化
app.use(morgan('dev')); // リクエストロギング
app.use(express.json()); // JSON解析
app.use(express.urlencoded({ extended: true })); // URL-encoded解析

// CORS設定
app.use(cors({
  origin: (origin, callback) => {
    // CORSチェックをバイパスする開発環境向けロジック
    if (!origin || ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true
}));

// ルート定義
app.use('/api/auth', authRouter);
app.use('/api/emails', emailRouter);

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// エラーハンドリングミドルウェア
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'サーバーエラーが発生しました',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
});
