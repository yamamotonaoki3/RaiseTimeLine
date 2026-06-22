# システム構成図

[← 要件定義書に戻る](../requirements.md)

---

## 1. インフラ構成図

※ EC2 利用については確定前だが、現時点の AWS 構成案として整備する。

```mermaid
flowchart LR
    User["👤 ユーザー\n(ブラウザ)"]
    Route53["Route 53\n(DNS)"]
    ALB["ALB\n(Application Load Balancer)"]
    EC2_FE["EC2\nNginx\nReact ビルド成果物"]
    EC2_BE["EC2\nSpring Boot\n(Java 25)"]
    RDS["RDS\nPostgreSQL 17"]
    S3["S3\n画像ストレージ\n(投稿画像・アイコン)"]

    User --> Route53
    Route53 --> ALB
    ALB --> EC2_FE
    ALB --> EC2_BE
    EC2_BE --> RDS
    EC2_BE --> S3
    EC2_FE -.-> EC2_BE
```

---

## 2. アプリケーション構成（3層アーキテクチャ）

```mermaid
flowchart LR
    subgraph Frontend["フロントエンド (React + TypeScript)"]
        Pages["Pages\n各画面コンポーネント"]
        Components["Components\n共通UI部品"]
        API_Client["API Client\n(Axios)"]
    end

    subgraph Backend["バックエンド (Spring Boot)"]
        Controller["Controller\nREST API エンドポイント"]
        Service["Service\nビジネスロジック"]
        Repository["Repository\nDB アクセス (JPA)"]
        S3Service["S3 Service\n画像アップロード"]
    end

    subgraph DB["データベース"]
        PostgreSQL["PostgreSQL 17"]
    end

    subgraph Storage["ストレージ"]
        AmazonS3["AWS S3"]
    end

    Pages --> Components
    Pages --> API_Client
    API_Client -- HTTP/REST --> Controller
    Controller --> Service
    Service --> Repository
    Service --> S3Service
    Repository --> PostgreSQL
    S3Service --> AmazonS3
```

---

## 3. 開発環境構成

```mermaid
flowchart LR
    subgraph Local["ローカル開発環境 (Docker)"]
        FE_Dev["React Dev Server\n(Vite)"]
        BE_Dev["Spring Boot\n(Gradle)"]
        DB_Dev["PostgreSQL 17\n(Docker コンテナ)"]
    end

    FE_Dev -- API リクエスト --> BE_Dev
    BE_Dev --> DB_Dev
```

| 項目 | ローカル環境 | 本番環境（AWS） |
| --- | --- | --- |
| フロントエンド | Vite 開発サーバー | EC2 + Nginx |
| バックエンド | Spring Boot 直接起動 | EC2 |
| DB | Docker（PostgreSQL） | RDS（PostgreSQL） |
| 画像 | ローカルまたは S3 | S3 |
