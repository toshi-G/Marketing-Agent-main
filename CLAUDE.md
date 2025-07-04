# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 開発コマンド

**開発サーバー**
```bash
npm run dev  # Next.js開発サーバーを起動（http://localhost:3000）
```

**ビルド・本番環境**
```bash
npm run build    # アプリケーションをビルド
npm start        # 本番サーバーを起動
```

**コード品質**
```bash
npm run lint     # ESLintを実行
npm run test     # テストを実行（現在はvalidation.test.ts）
```

**データベース操作**
```bash
npm run prisma:generate  # Prismaクライアントを生成
npm run prisma:migrate   # データベースマイグレーションを実行
npm run prisma:studio    # Prisma Studio GUIを開く
```

## プロジェクトアーキテクチャ

### コアシステム設計
8つの専門AIエージェントが順次連携してマーケティングコンテンツを生成するAI駆動型マーケティング自動化システム。各エージェントが前のエージェントの出力を処理するワークフローベースのアーキテクチャを採用。

### エージェント実行フロー
1. **市場調査エージェント** → 収益性の高い市場ジャンルとトレンドを特定
2. **コンテンツスクレイピングエージェント** → SNSから高エンゲージメントフレーズを50個以上抽出
3. **NLP分類エージェント** → 訴求タイプ・感情・構造別にコンテンツを分類
4. **テンプレート最適化エージェント** → 高成功率のコンテンツテンプレートを5つ作成
5. **商品設計エージェント** → 商品ラインナップとセールスファネルを設計
6. **コンテンツ生成エージェント** → LP・SNS投稿・メールシーケンスを生成
7. **コピー生成エージェント** → 60個以上のフック（煽り・共感・逆張り系）を作成
8. **最適化・保存エージェント** → 成功パターンを再利用可能テンプレートとして保存

### 主要アーキテクチャパターン

**エージェントシステム**
- 全エージェントは`BaseAgent`を継承（app/lib/agents/base.ts）
- 各エージェントは`formatInput()`、`parseOutput()`、`validateOutput()`を実装
- `AgentFactory`で事前定義された実行順序でエージェントを作成
- 内蔵リトライロジック（3回試行）とエラーハンドリング
- エージェント間のデータ整合性を保つ出力バリデーション

**データベーススキーマ**
- **Workflow**: ステータス管理付きメインワークフロー追跡
- **Agent**: 個別エージェントの実行状態と結果
- **WorkflowResult**: 処理済み出力と分析データ
- **Template**: パフォーマンス指標付き再利用可能コンテンツテンプレート
- **MarketData**: 市場調査インサイト
- **Content**: 生成コンテンツ

**API統合**
- AI処理にGemini Pro APIを使用
- レート制限：10リクエスト/分、50Kトークン/分
- エージェント1つあたり5分、ワークフロー全体で最大30分のタイムアウト
- 包括的エラーハンドリングとステータス追跡

### 技術スタック詳細

**フロントエンド**: App Router付きNext.js 15.1.3、React 19、TypeScript 5
**スタイリング**: shadcn/uiコンポーネント付きTailwind CSS 3.4
**データベース**: Prisma ORM付きSQLite（スキーマはprisma/schema.prisma）
**AI**: 構造化プロンプト付きGoogle Gemini Pro API
**状態管理**: サーバーサイド永続化付きReactフック

### 環境設定

必要な環境変数：
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### ワークフロー実行モデル

ワークフローはステートフルで永続化される：
- 各ワークフローは8つのエージェントインスタンスを作成
- エージェントは順次実行され、`AgentContext`を通じてデータを受け渡し
- 前のエージェントの出力は`previousOutputs` Mapからアクセス可能
- データベースポーリングによるリアルタイムステータス更新
- 包括的エラー回復と再開機能

### コンテンツ生成パターン

各エージェントタイプに対して構造化された出力を生成（app/lib/api/types.tsで定義）：
- トレンド・収益性スコア付き市場調査
- エンゲージメント指標付きコンテンツパターン
- 信頼度スコア付きNLP分類
- ROI予測付きビジネス戦略
- 最適化データ付きマルチプラットフォームコンテンツ

### テスト戦略

現在は最小限のテスト設定：
- 単一テストファイル：tests/validation.test.ts
- ユーティリティと検証関数をテスト
- カスタムテストコマンドでTypeScriptをコンパイルし、Node.js内蔵テストランナーで実行