/**
 * メール関連のAPIルーター
 */

const express = require('express');
const router = express.Router();
const graphService = require('../services/graph-service');

/**
 * トークンの検証ミドルウェア
 */
const validateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '認証が必要です' });
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '有効なトークンがありません' });
  }
  
  // トークンを検証する実装はここに追加
  // 実際の本番環境ではトークンの有効期限やシグネチャを検証する必要があります
  
  req.accessToken = token;
  next();
};

/**
 * 特定のBDMコードに関連するメールを取得
 * @route GET /api/emails/bdm-emails
 */
router.get('/bdm-emails', validateToken, async (req, res) => {
  try {
    const { bdmCode } = req.query;
    const accessToken = req.accessToken;
    
    // bdmCodeパラメータのバリデーション
    if (bdmCode && !/^BDM\d{4}$/i.test(bdmCode)) {
      return res.status(400).json({ 
        error: '無効なBDMコード形式です。BDM####の形式である必要があります' 
      });
    }
    
    // GraphサービスからBDMコードに一致するメールを取得
    const emails = await graphService.getEmailsByBdmCode(accessToken, bdmCode);
    
    res.json({ emails });
  } catch (error) {
    console.error('メール取得エラー:', error);
    res.status(500).json({ error: 'メールの取得に失敗しました' });
  }
});

module.exports = router;
