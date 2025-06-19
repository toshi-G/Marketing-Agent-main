# Marketing Agent - AI駆動マーケティング自動化システム

8つの専門AIエージェントが連携し、市場調査からコンテンツ生成まで自動化するマーケティングシステムです。

## 機能

- **市場調査エージェント**: トレンドと収益性の高いジャンルを特定
- **トレンド分析エージェント**: SNSから高反応フレーズを抽出（50個以上）
- **NLP分類エージェント**: 訴求タイプ・感情・構造別に分類
- **テンプレート最適化エージェント**: 高成功率の構成パターンを選出（5つ）
- **商品設計エージェント**: 最適な商品構成とセールスファネル設計
- **コンテンツ生成エージェント**: LP・SNS投稿・メールシーケンスを自動生成
- **コピー生成エージェント**: 煽り・共感・逆張り系フックを60個以上量産
- **最適化・保存エージェント**: 成功パターンをテンプレート化

## 技術スタック

- **フロントエンド**: Next.js 15.1.3, React 19, TypeScript 5
- **スタイリング**: Tailwind CSS 3.4, shadcn/ui
- **バックエンド**: Next.js API Routes
- **データベース**: SQLite + Prisma ORM
- **AI**: Gemini Pro API

## セットアップ

1. **依存関係のインストール**
```bash
npm install
```

2. **環境変数の設定**
```bash
cp .env.example .env
```

`.env`ファイルを編集し、必要な環境変数を設定してください：
```bash
# 必須: Google Gemini APIキー（https://makersuite.google.com/app/apikey から取得）
GEMINI_API_KEY=your_gemini_api_key_here

# 必須: データベース接続URL（開発環境ではデフォルトで設定済み）
DATABASE_URL="file:./prisma/dev.db"
```

3. **データベースのセットアップ**
```bash
npm run prisma:generate
npm run prisma:migrate
```

4. **開発サーバーの起動**
```bash
npm run dev
```

5. **動作確認**
- http://localhost:3000 でアプリケーションにアクセス
- http://localhost:3000/api/health でシステム状態を確認

ヘルスチェックで以下の項目が `connected` になっていることを確認してください：
- データベース接続
- Gemini API接続

## 使い方

1. **新規ワークフローの作成**
   - 「新規ワークフロー」ボタンをクリック
   - ワークフロー名を入力（必須）
   - 対象ジャンルとキーワードを入力（任意）
   - 「ワークフローを開始」をクリック

2. **ワークフローの実行**
   - 8つのエージェントが順番に実行されます
   - 各エージェントの進捗状況はリアルタイムで確認可能
   - 完了までには通常10-30分かかります

3. **結果の確認**
   - ワークフロー詳細ページで各エージェントの出力を確認
   - 生成されたコンテンツやテンプレートを活用

## プロジェクト構造

```
marketing-agent/
├── app/
│   ├── api/              # APIエンドポイント
│   ├── components/       # UIコンポーネント
│   ├── lib/
│   │   ├── agents/      # エージェント実装
│   │   ├── api/         # APIクライアント
│   │   └── utils/       # ユーティリティ
│   ├── workflows/       # ワークフロー詳細ページ
│   └── page.tsx         # ホームページ
├── prisma/
│   └── schema.prisma    # データベーススキーマ
└── public/              # 静的ファイル
```

## 開発

**Prismaスタジオ**
```bash
npm run prisma:studio
```

**型の生成**
```bash
npm run prisma:generate
```

**リント**
```bash
npm run lint
```

**ビルド**
```bash
npm run build
```

## 注意事項

- Gemini APIの利用には料金が発生します
- 各ワークフローで約8回のAPI呼び出しが行われます
- レート制限に注意してください（デフォルト: 10リクエスト/分）

## ライセンス

このプロジェクトはプライベートプロジェクトです。
