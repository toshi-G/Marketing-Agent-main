"use strict";
// レート制限ミドルウェア
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
const server_1 = require("next/server");
const config_1 = require("@/lib/api/config");
// メモリ内でレート制限を管理（本番環境ではRedisを推奨）
const requestCounts = new Map();
function rateLimit(request) {
    // レート制限をスキップする条件
    if (process.env.NODE_ENV === 'development') {
        return null;
    }
    // クライアントIPの取得
    const ip = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1分
    const maxRequests = config_1.API_CONFIG.RATE_LIMIT_REQUESTS_PER_MINUTE;
    // 現在のリクエスト数を取得
    const clientData = requestCounts.get(ip) || { count: 0, resetTime: now + windowMs };
    // リセット時間を過ぎていたらカウントをリセット
    if (now > clientData.resetTime) {
        clientData.count = 0;
        clientData.resetTime = now + windowMs;
    }
    // リクエスト数をインクリメント
    clientData.count++;
    requestCounts.set(ip, clientData);
    // 制限を超えた場合
    if (clientData.count > maxRequests) {
        return server_1.NextResponse.json({
            error: 'Too many requests',
            message: `Rate limit exceeded. Maximum ${maxRequests} requests per minute.`,
            retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        }, {
            status: 429,
            headers: {
                'Retry-After': String(Math.ceil((clientData.resetTime - now) / 1000)),
                'X-RateLimit-Limit': String(maxRequests),
                'X-RateLimit-Remaining': String(Math.max(0, maxRequests - clientData.count)),
                'X-RateLimit-Reset': String(clientData.resetTime)
            }
        });
    }
    return null;
}
// 定期的にメモリをクリーンアップ
setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of Array.from(requestCounts.entries())) {
        if (now > data.resetTime + 60000) { // 1分以上古いエントリを削除
            requestCounts.delete(ip);
        }
    }
}, 60000); // 1分ごと
