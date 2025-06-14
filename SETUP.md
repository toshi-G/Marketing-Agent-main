# Marketing Agent セットアップガイド

## 必要な環境
- Node.js 20.0.0以上
- npm 10.0.0以上
- Gemini API キー（Googleから取得）

## クイックスタート

### 1. リポジトリのクローン
```bash
git clone [repository-url]
cd marketing-agent
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定
```bash
cp .env.example .env
```

`.env`ファイルを編集し、Gemini APIキーを設定：
```
GEMINI_API_KEY=gm-xxxxxxxxxxxxx
```

### 4. データベースの初期化
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. 開発サーバーの起動
```bash
npm run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## 本番環境へのデプロイ

### Dockerを使用する場合
```bash
# イメージのビルド
docker-compose build

# コンテナの起動
docker-compose up -d
```

### Vercelにデプロイする場合
1. Vercelアカウントを作成
2. プロジェクトをインポート
3. 環境変数を設定
4. デプロイ

## API使用量の管理

### レート制限
- デフォルト: 10リクエスト/分
- 設定場所: `app/lib/api/config.ts`

### 料金の目安
- 1ワークフロー実行 = 8回のAPI呼び出し
- 各呼び出し: 約4,000トークン使用
- 合計: 約32,000トークン/ワークフロー

## トラブルシューティング

### データベースエラー
```bash
# データベースの再作成
rm prisma/dev.db
npm run prisma:migrate
```

### APIエラー
- Gemini APIキーが正しく設定されているか確認
- レート制限に達していないか確認
- `/api/health`エンドポイントでシステム状態を確認

### ビルドエラー
```bash
# キャッシュのクリア
rm -rf .next node_modules
npm install
npm run build
```

## システムアーキテクチャ

### エージェントの実行フロー
1. **市場調査** → トレンドと収益性の高いジャンルを特定
2. **トレンド分析** → SNSから高反応フレーズを50個以上抽出
3. **NLP分類** → 訴求タイプ・感情・構造別に分類
4. **テンプレート最適化** → 高成功率の構成パターンを5つ選出
5. **商品設計** → 商品構成とセールスファネル設計
6. **コンテンツ生成** → LP・SNS・メールを自動生成
7. **コピー生成** → 60個以上のフック生成
8. **最適化・保存** → 成功パターンのテンプレート化

### データベーススキーマ
- `Workflow`: ワークフロー管理
- `Agent`: 各エージェントの実行状態
- `WorkflowResult`: 実行結果
- `Template`: 生成されたテンプレート
- `MarketData`: 市場データ
- `Content`: 生成コンテンツ

## 開発ガイド

### 新しいエージェントの追加
1. `app/lib/agents/`に新しいエージェントクラスを作成
2. `BaseAgent`を継承
3. 必要なメソッドを実装
4. `AgentFactory`に登録
5. `AGENT_SEQUENCE`に追加

### UIコンポーネントの追加
- shadcn/uiコンポーネントを使用
- `app/components/ui/`に配置
- Tailwind CSSでスタイリング

## セキュリティ

### APIキーの管理
- 環境変数で管理
- クライアントサイドに露出しない
- 定期的にローテーション

### データ保護
- SQLiteデータベースは暗号化されていません
- 本番環境では適切なデータベースを使用

## サポート

問題が発生した場合は、以下を確認してください：
1. README.mdのトラブルシューティング
2. `/api/health`エンドポイント
3. ログファイル
4. Issueトラッカー
