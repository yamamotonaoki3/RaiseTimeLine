# Datadog モニター定義（準備・未連携）

Datadog との実連携（Agent導入・APIキー設定）は現時点では行っていない。連携時にそのまま利用できるモニター定義を準備物としてここに記載する。

## 前提条件（連携時に必要なもの）

- Datadog Agent の導入（本番環境のコンテナ標準出力を収集する設定）
- `DD_API_KEY` / `DD_SITE` の設定
- ログのインデックス化（JSON構造化ログが Datadog 上で正しくパースされていること）

## モニター定義例

### 1. 5xx エラー率上昇アラート

```json
{
  "name": "[RaiseTimeLine] 5xx error rate high",
  "type": "log alert",
  "query": "logs(\"service:api @http_status:>=500\").index(\"main\").rollup(\"count\").last(\"5m\") > 10",
  "message": "5xx エラーが5分間で10件を超えました。 @slack-alerts",
  "options": {
    "thresholds": { "critical": 10 }
  }
}
```

### 2. レスポンスタイム悪化アラート

```json
{
  "name": "[RaiseTimeLine] response time degraded",
  "type": "log alert",
  "query": "logs(\"service:api\").index(\"main\").rollup(\"p95\", \"@duration_ms\").last(\"5m\") > 1000",
  "message": "APIのレスポンスタイム（p95）が1秒を超えています。 @slack-alerts",
  "options": {
    "thresholds": { "critical": 1000 }
  }
}
```

### 3. 認証失敗の急増アラート

```json
{
  "name": "[RaiseTimeLine] auth failure spike",
  "type": "log alert",
  "query": "logs(\"service:api @http_status:401\").index(\"main\").rollup(\"count\").last(\"5m\") > 20",
  "message": "401エラーが5分間で20件を超えました。不正アクセスの可能性があります。 @slack-alerts",
  "options": {
    "thresholds": { "critical": 20 }
  }
}
```

## 連携手順（将来対応時）

1. Datadog Agent をインフラに導入し、コンテナログを収集する。
2. 上記JSON定義を Datadog Monitor API（`POST /api/v1/monitor`）または管理画面から登録する。
3. 通知先（Slack等）を `message` 内のメンションに合わせて設定する。
