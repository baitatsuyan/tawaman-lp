# タワマン大家 個別相談 LP（青山綜合地所）

日本のお客様向けの静的LP。HTML＋CSS＋素のJSのみで、ビルド不要。
リポジトリ直下の LP（Miyama & Jung Partners 版）とは別会社・別サイトで、ファイルも共有していません。

公開URL: https://tawamanoya-aoyama.netlify.app/

```
aoyama/
├── site/                 公開されるのはこのフォルダだけ
│   ├── index.html        LP
│   ├── tokushoho/        特定商取引法に基づく表記
│   └── assets/
│       ├── style.css     スタイル
│       ├── form.js       フォーム送信（Google フォーム）
│       ├── tools.js      「数字で確かめる」欄（試算・坪単価グラフ）
│       ├── tower.jpg     プロフィール写真
│       └── seminar-cover.jpg 特典資料の表紙
├── tools/setup-google-form.gs  Google フォームの設問作成スクリプト
├── netlify.toml          Netlify の設定（site/ を配信）
├── CLAUDE.md             Claude Code 向けの作業ルール
└── README.md
```

## Netlify の設定（初回のみ）

1. app.netlify.com →「Add new project」→「Import an existing project」→ GitHub → このリポジトリ
2. **Base directory を `aoyama`** にする（ビルドコマンド・公開フォルダは `aoyama/netlify.toml` から入る）
3. 公開するブランチを選ぶ（確認中は作業ブランチ、本番は `main`）
4. 作成後、「Site configuration」→「Change site name」で `tawamanoya-aoyama` にする

ローカル確認:

```bash
python3 -m http.server 8000 -d aoyama/site
# http://localhost:8000/
```

## 公開前に差し替えるもの

`grep -rn TODO aoyama/site` で拾えます。

| 箇所 | やること |
|---|---|
| `site/assets/form.js` の `FORM_ACTION` と `ENTRY` | `tools/setup-google-form.gs` で Google フォームを作り、formResponse の URL と entry ID を入れる。**入れるまで送信はエラーになる**（回答が黙って消えないようにしている） |
| `site/index.html` の LINE ボタン | `https://lin.ee/TODO` を LINE公式アカウント「BAI Capital」の友だち追加URLに |
| `site/tokushoho/index.html` | 代表者名・電話の受付時間 |
| プライバシーポリシーのリンク | `#privacy-policy`（フッターへのアンカー）のまま。青山綜合地所のポリシーURLに差し替え |

## 特典の渡し方

アンケートの送信後、サンクス表示に LINE公式アカウント「BAI Capital」の友だち追加ボタンを出します。資料（PDF）は LINE 側で送ります（友だち追加時のあいさつメッセージなど）。このサイトには PDF を置きません。

## フォーム

スコアリングの主軸は `income`（世帯年収）・`equity`（自己資金）・`timing`（検討時期）。日本在住のお客様を前提に、在留資格ではなく `occupation`（ご職業）を聞きます。

## 坪単価グラフ

`site/assets/data/market.json` があるときだけ表示されます（ないと欄ごと非表示）。データは国土交通省「不動産情報ライブラリ」の API から作ります。グラフ下の出典・加工した旨・クレジット文は利用約款で求められているので消さないこと。
