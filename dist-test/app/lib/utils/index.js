"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatDate = formatDate;
exports.formatNumber = formatNumber;
exports.formatCurrency = formatCurrency;
exports.truncate = truncate;
exports.slugify = slugify;
exports.safeJsonParse = safeJsonParse;
exports.delay = delay;
exports.getErrorMessage = getErrorMessage;
exports.getStatusColor = getStatusColor;
exports.getAgentTypeName = getAgentTypeName;
exports.getScoreColor = getScoreColor;
exports.isValidEmail = isValidEmail;
exports.isValidUrl = isValidUrl;
exports.chunk = chunk;
exports.unique = unique;
exports.omit = omit;
exports.pick = pick;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
// フォーマット関数
function formatDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).format(d);
}
function formatNumber(num) {
    return new Intl.NumberFormat('ja-JP').format(num);
}
function formatCurrency(amount) {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: 'JPY'
    }).format(amount);
}
// 文字列処理
function truncate(str, length) {
    if (str.length <= length)
        return str;
    return str.slice(0, length) + '...';
}
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}
// JSON安全パース
function safeJsonParse(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch {
        return fallback;
    }
}
// 遅延関数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// エラーメッセージ取得
function getErrorMessage(error) {
    if (error instanceof Error)
        return error.message;
    return String(error);
}
// ステータスカラー
function getStatusColor(status) {
    switch (status) {
        case 'completed':
            return 'text-green-600 bg-green-100';
        case 'running':
            return 'text-blue-600 bg-blue-100';
        case 'failed':
            return 'text-red-600 bg-red-100';
        case 'pending':
        default:
            return 'text-gray-600 bg-gray-100';
    }
}
// エージェントタイプの日本語変換
function getAgentTypeName(type) {
    const names = {
        market_research: '市場調査',
        content_scraping: 'トレンド分析',
        nlp_classification: 'データ分類',
        template_optimization: 'テンプレート最適化',
        business_strategy: '商品設計',
        content_creation: 'コンテンツ生成',
        copy_generation: 'コピー生成',
        optimization_archive: '最適化・保存'
    };
    return names[type] || type;
}
// パフォーマンススコアの色
function getScoreColor(score) {
    if (score >= 80)
        return 'text-green-600';
    if (score >= 60)
        return 'text-yellow-600';
    return 'text-red-600';
}
// バリデーション
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
// 配列ユーティリティ
function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
function unique(array) {
    return Array.from(new Set(array));
}
// オブジェクトユーティリティ
function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach(key => delete result[key]);
    return result;
}
function pick(obj, keys) {
    const result = {};
    keys.forEach(key => {
        if (key in obj)
            result[key] = obj[key];
    });
    return result;
}
