"""公開用ファイルだけを dist/ にコピーする（README やスクリプトを公開しないため）

    python tools/build.py
    npx netlify-cli deploy --dir dist --no-build --prod
"""
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
PUBLIC = ["index.html", "ko", "tokushoho", "assets", "_headers"]

# Windows では削除直後のフォルダが残ることがあるので、空フォルダが残っても続行する
shutil.rmtree(DIST, ignore_errors=True)
DIST.mkdir(exist_ok=True)
for name in PUBLIC:
    src = ROOT / name
    if src.is_dir():
        shutil.copytree(src, DIST / name, dirs_exist_ok=True)
    else:
        shutil.copy2(src, DIST / name)

print("built:", DIST)
