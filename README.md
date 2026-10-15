# タワマン大家 個別相談 LP

日本語版と韓国語版の2言語構成。静的HTML＋CSSのみで、ビルド不要。

```
.
├── index.html          日本語版（/）
├── ko/index.html       韓国語版（/ko/）
├── assets/
│   ├── style.css       共通スタイル（両言語で共有）
│   ├── form.js         フォーム送信・特典ダウンロード
│   ├── dl/…/*.pdf      特典PDF（推測されにくいパス）
│   ├── tower.jpg       プロフィール写真（タワーマンション）
│   └── seminar-cover.jpg セミナー資料の表紙
├── tools/setup-google-form.gs  Google フォームの設問作成スクリプト
├── tools/build.py      公開用ファイルを dist/ に集める
├── netlify.toml        Netlify のビルド設定（GitHub 連携時）
├── CLAUDE.md           Claude Code 向けの作業ルール
└── README.md
```

公開URL: https://tawamanoya-miyama.netlify.app/ （Netlify）

デプロイ: GitHub の `main` に push すると Netlify が自動で公開します（Netlify とリポジトリの連携後）。手元から直接公開する場合:

```bash
python tools/build.py
npx netlify-cli deploy --dir dist --no-build --prod --site tawamanoya-miyama
```

ローカル確認:

```bash
python3 -m http.server 8000
# http://localhost:8000/     日本語
# http://localhost:8000/ko/  韓国語
```

---

## 公開前に必ず差し替えるもの

`TODO` コメントを埋め込んであるので、`grep -rn "TODO\|example.com\|privacy-policy" .` で拾えます。

| 箇所 | 現状 | やること |
|---|---|---|
| プライバシーポリシーのリンク | `#privacy-policy`（フッターへのアンカー） | Miyama & Jung Partners のポリシーURLに差し替え。**まだ同社サイトに存在しないので、先に作成が必要** |
| 動画の `<iframe>` タイトル属性 | `出演回 1 / 2` | 実際の動画タイトルに差し替え（表示はされないがアクセシビリティ用） |

動画のサムネイルとタイトルは YouTube が自動で表示するので、こちら側で用意する必要はありません。

---

## フォーム連携

設問は「資料を渡すため」ではなく「リードの質を判定するため」に設計しています。スコアリングの主軸は次の3つです。

- `income`（世帯年収）
- `equity`（自己資金）
- `timing`（検討時期）

これに `residency`（国籍・在留資格）を掛けると、実際に融資が引けるかどうかの当たりがつきます。永住者かどうかで利用可能な金融機関が大きく変わるため、韓国語版では特に重要な設問です。

推奨する振り分け:

| 条件 | 対応 |
|---|---|
| 年収1,500万以上 × 自己資金1,000万以上 × 3か月以内 | 即日連絡 |
| 上記のいずれか1つが欠ける | 数日以内に連絡 |
| 情報収集段階 | 資料送付のみ（宣伝メールは送らない。送る場合は特定電子メール法のオプトイン同意が別途必要） |
| 日本非居住 | 融資条件の説明を先に送る |

送信完了後、同じページ内にサンクス表示とダウンロードボタンを出します。特典PDFは `assets/dl/<ランダム文字列>/` に置き、パスは HTML に書かず `assets/form.js` が送信後にだけリンクを生成します。ただし静的サイトなので、JS を読めばURLは分かります（完全なゲートではありません）。検索エンジンに拾われないよう、公開先で `assets/dl/` に `X-Robots-Tag: noindex` を付けてください。PDFを差し替えるときは同じパスに上書きするか、フォルダ名を変えて `form.js` の `DOWNLOAD_URL` も更新します。

---

## 実装メモ

- CSSは `assets/style.css` 1枚のみ。言語による字体の切り替えは `html[lang="ko"]` のセレクタで行っています。フォントはGoogle Fonts（Noto Serif JP/KR、Noto Sans JP/KR）。
- レスポンシブのブレークポイントは1か所（`max-width: 1000px`）。それ以下は全グリッドが1カラムになります。
- カラーは `:root` のCSS変数にまとめてあります。アクセント色は `--accent: #C0A667`。
- フォーム送信・入力チェック・サンクス表示は `assets/form.js`（依存ライブラリなし）。Google フォームの設問は `tools/setup-google-form.gs` で作成します。
- 動画は `youtube-nocookie.com` の埋め込みを使用。Cookie同意バナーを入れる場合はクリック後に読み込むファサード方式への変更を検討してください。

## 未実装・検討事項

- Cookie同意バナー（韓国からのアクセスがあるため、必要性を要確認）
- 構造化データ（`FAQPage` は入れる価値があります）
- アクセス解析タグ
