/**
 * 認証関連のAPIルーター
 */

const express = require('express');
const router = express.Router();
const authService = require('../services/auth-service');
const graphService = require('../services/graph-service');

/**
 * ログイン認証URLの取得
 * クライアントはこのURLにリダイレクトして認証を開始
 */
router.get('/login', async (req, res) => {
  try {
    // リダイレクトURIの設定
    const redirectUri = process.env.REDIRECT_URI;
    
    // 認証URLの取得
    const authUrl = await authService.getAuthUrl(redirectUri);
    res.json({ authUrl });
  } catch (error) {
    console.error('認証URLの取得に失敗しました:', error);
    res.status(500).json({ error: '認証URLの取得に失敗しました' });
  }
});

/**
 * 認証コールバック - Microsoftから認証後にリダイレクトされるエンドポイント
 * コードからトークンを取得してクライアントにリダイレクト
 */
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      throw new Error('認証コードがありません');
    }
    
    // リダイレクトURIの設定
    const redirectUri = process.env.REDIRECT_URI;
    
    // コードからトークンを取得
    const tokenResponse = await authService.getTokenFromCode(code, redirectUri);
    
    // ユーザー情報の取得（@ip-healthcare.comのみアクセス許可）
    const userInfo = await graphService.getUserProfile(tokenResponse.accessToken);
    
    if (!userInfo.mail.toLowerCase().includes('@ip-healthcare.com')) {
      return res.redirect(
        `/auth-error?message=${encodeURIComponent('@ip-healthcare.comドメインのメールアドレスのみが許可されています')}`
      );
    }
    
    // クライアントアプリにリダイレクト（トークン付き）
    // 実際の実装では、HTTPSで安全に扱うか、状態管理システムを使用してください
    const clientUrl = process.env.ALLOWED_ORIGINS.split(',')[0];
    res.redirect(`${clientUrl}/case-detail.html?token=${tokenResponse.accessToken}`);
    
  } catch (error) {
    console.error('認証コールバック処理エラー:', error);
    res.status(500).json({ error: '認証処理に失敗しました' });
  }
});

/**
 * トークンの更新
 * リフレッシュトークンを使って新しいアクセストークンを取得
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'リフレッシュトークンが必要です' });
    }
    
    const newTokenInfo = await authService.getTokenFromRefreshToken(refreshToken);
    res.json({
      accessToken: newTokenInfo.accessToken,
      refreshToken: newTokenInfo.refreshToken,
      expiresOn: newTokenInfo.expiresOn
    });
  } catch (error) {
    console.error('トークン更新エラー:', error);
    res.status(500).json({ error: 'トークンの更新に失敗しました' });
  }
});

module.exports = router;
