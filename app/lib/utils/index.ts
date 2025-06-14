import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// フォーマット関数
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ja-JP').format(num);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY'
  }).format(amount);
}

// 文字列処理
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// JSON安全パース
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// 遅延関数
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// エラーメッセージ取得
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

// ステータスカラー
export function getStatusColor(status: string): string {
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
export function getAgentTypeName(type: string): string {
  const names: Record<string, string> = {
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
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

// バリデーション
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 配列ユーティリティ
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

// オブジェクトユーティリティ
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) result[key] = obj[key];
  });
  return result;
}
