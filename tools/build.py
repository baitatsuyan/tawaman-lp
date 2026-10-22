"""公開用ファイルだけを dist/ にコピーする（README やスクリプトを公開しないため）

    python tools/build.py           日本語版・韓国語版（tawamanoya-miyama）
    python tools/build.py aoyama    青山綜合地所版（tawamanoya-aoyama）

Netlify では、サイトの環境変数 SITE=aoyama でも青山綜合地所版になる（netlify.toml は共通）。

    npx netlify-cli deploy --dir dist --no-build --prod
"""
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
SITE = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("SITE", "miyama")

# 公開先のパス → 元のパス。ページ内の相対パスの書き換え（元 → 公開先）
if SITE == "aoyama":
    # aoyama/ をサイトのルートに置く。特典はLINEで渡すので assets/dl/ は公開しない
    PUBLIC = {
        "index.html": ("aoyama/index.html", {'"../assets/': '"assets/'}),
        "tokushoho/index.html": ("aoyama/tokushoho/index.html", {'"../../assets/': '"../assets/'}),
        "assets": ("assets", None),
        "_headers": ("_headers", None),
    }
    IGNORE = shutil.ignore_patterns("dl")
elif SITE == "miyama":
    PUBLIC = {name: (name, None) for name in ["index.html", "ko", "tokushoho", "assets", "_headers"]}
    IGNORE = None
else:
    sys.exit(f"unknown site: {SITE}")

# Windows では削除直後のフォルダが残ることがあるので、空フォルダが残っても続行する
shutil.rmtree(DIST, ignore_errors=True)
DIST.mkdir(exist_ok=True)
for dest, (name, rewrite) in PUBLIC.items():
    src, out = ROOT / name, DIST / dest
    out.parent.mkdir(parents=True, exist_ok=True)
    if src.is_dir():
        shutil.copytree(src, out, dirs_exist_ok=True, ignore=IGNORE)
    elif rewrite:
        text = src.read_text(encoding="utf-8")
        for old, new in rewrite.items():
            assert old in text, f"{name}: {old} が見つからない"
            text = text.replace(old, new)
        out.write_text(text, encoding="utf-8")
    else:
        shutil.copy2(src, out)

print("built:", SITE, DIST)
