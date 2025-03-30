/**
 * Microsoft認証サービス
 * MSALを使用してMicrosoft Graph APIの認証を行うためのサービス
 */

// 依存パッケージ
const msal = require('@azure/msal-node');

// 設定
const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_APP_ID,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_APP_TENANT}`,
    clientSecret: process.env.MICROSOFT_APP_SECRET,
  }
};

// MSALインスタンスの生成
const confidentialClientApp = new msal.ConfidentialClientApplication(msalConfig);

// スコープ定義 - 必要なアクセス権限
const scopes = ['Mail.Read', 'User.Read'];

/**
 * 認証URLを取得
 * @param {string} redirectUri - 認証後のリダイレクトURL
 * @returns {Promise<string>} - 認証URL
 */
async function getAuthUrl(redirectUri) {
  const authCodeUrlParameters = {
    scopes,
    redirectUri,
  };

  return await confidentialClientApp.getAuthCodeUrl(authCodeUrlParameters);
}

/**
 * 認証コードからトークンを取得
 * @param {string} code - 認証コード
 * @param {string} redirectUri - リダイレクトURI
 * @returns {Promise<Object>} - トークン情報
 */
async function getTokenFromCode(code, redirectUri) {
  const tokenRequest = {
    code,
    scopes,
    redirectUri,
  };

  return await confidentialClientApp.acquireTokenByCode(tokenRequest);
}

/**
 * リフレッシュトークンから新しいアクセストークンを取得
 * @param {string} refreshToken - リフレッシュトークン
 * @returns {Promise<Object>} - 新しいトークン情報
 */
async function getTokenFromRefreshToken(refreshToken) {
  const tokenRequest = {
    refreshToken,
    scopes,
  };

  return await confidentialClientApp.acquireTokenByRefreshToken(tokenRequest);
}

// モジュールのエクスポート
module.exports = {
  getAuthUrl,
  getTokenFromCode,
  getTokenFromRefreshToken,
  scopes
};
