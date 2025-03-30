/**
 * Microsoft Graph API連携サービス
 * Microsoft Graphを利用してメールデータを取得・処理するためのサービスクラス
 */

// 依存パッケージ
const graph = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

/**
 * トークン付きMicrosoft Graph APIクライアントを取得
 * @param {string} accessToken - Microsoft Graph APIのアクセストークン
 * @returns {Object} - 認証済みのGraphクライアント
 */
function getAuthenticatedClient(accessToken) {
  return graph.Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    }
  });
}

/**
 * BDMコードに基づいてメールを取得し、フィルタリングする
 * @param {string} accessToken - Microsoft Graph APIのアクセストークン
 * @param {string} bdmCode - 特定のBDMコード (例: "BDM0001")
 * @returns {Promise<Array>} - フィルタリングされたメールリスト
 */
async function getEmailsByBdmCode(accessToken, bdmCode) {
  try {
    const client = getAuthenticatedClient(accessToken);
    
    // 最近の100件のメールを取得
    const result = await client
      .api('/me/messages')
      .top(100)
      .select('subject,bodyPreview,receivedDateTime,from,toRecipients,ccRecipients')
      .orderby('receivedDateTime DESC')
      .get();
    
    // フィルタリング処理
    const filteredMessages = result.value.filter(message => {
      // ToまたはCCに@ip-healthcare.comを含むか確認
      const hasIpHealthcareInTo = message.toRecipients.some(recipient => 
        recipient.emailAddress.address.toLowerCase().includes('@ip-healthcare.com')
      );
      
      const hasIpHealthcareInCc = message.ccRecipients && message.ccRecipients.some(recipient => 
        recipient.emailAddress.address.toLowerCase().includes('@ip-healthcare.com')
      );
      
      // [BDM####]形式の社内管理番号を検索
      let hasBdmCode = false;
      
      if (bdmCode) {
        // 特定のBDMコードのみを検索
        hasBdmCode = new RegExp(`\\[${bdmCode}\\]`, 'i').test(message.subject);
      } else {
        // すべてのBDMコードを検索
        hasBdmCode = /\[BDM\d{4}\]/i.test(message.subject);
      }
      
      return (hasIpHealthcareInTo || hasIpHealthcareInCc) && hasBdmCode;
    });

    // クライアント側に必要な形式に変換
    return filteredMessages.map(email => ({
      id: email.id,
      subject: email.subject,
      from: email.from.emailAddress.address,
      preview: email.bodyPreview,
      date: email.receivedDateTime,
      to: email.toRecipients.map(r => r.emailAddress.address),
      cc: email.ccRecipients ? email.ccRecipients.map(r => r.emailAddress.address) : []
    }));
    
  } catch (error) {
    console.error('Error getting emails:', error);
    throw error;
  }
}

/**
 * ユーザープロファイル情報を取得
 * @param {string} accessToken - Microsoft Graph APIのアクセストークン
 * @returns {Promise<Object>} - ユーザー情報
 */
async function getUserProfile(accessToken) {
  try {
    const client = getAuthenticatedClient(accessToken);
    return await client
      .api('/me')
      .select('displayName,mail,userPrincipalName')
      .get();
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

// モジュールのエクスポート
module.exports = {
  getEmailsByBdmCode,
  getUserProfile
};
