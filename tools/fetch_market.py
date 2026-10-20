"""勝どき・晴海・豊洲・有明の中古マンション坪単価を集計して assets/data/market.json に書き出す

    REINFOLIB_API_KEY=発行されたキー python3 tools/fetch_market.py

出典：国土交通省 不動産情報ライブラリ（XIT001 不動産価格（取引価格・成約価格）情報取得API）
https://www.reinfolib.mlit.go.jp/help/apiManual/xit001/

- 地区ごと・四半期ごとに、坪単価（取引価格 ÷ 面積[坪]）の中央値を出す。
- 件数が MIN_COUNT 未満の四半期は値を出さない（1〜2件だと外れ値で大きく動くため）。
- タワーマンションかどうかは API からは判別できないので、地区内の「中古マンション等」すべてが対象。
- データは四半期ごとの更新。毎週回しても、更新がなければ中身は変わらない。
"""
import gzip
import json
import os
import statistics
import sys
import time
import urllib.error
import urllib.request
from datetime import date
from pathlib import Path

API = "https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001"
OUT = Path(__file__).resolve().parent.parent / "assets" / "data" / "market.json"

# 市区町村コード → 対象の地区。key は JSON・グラフ側の識別子
AREAS = [
    {"key": "kachidoki", "city": "13102", "district": "勝どき", "ja": "勝どき", "ko": "가치도키"},
    {"key": "harumi",    "city": "13102", "district": "晴海",   "ja": "晴海",   "ko": "하루미"},
    {"key": "toyosu",    "city": "13108", "district": "豊洲",   "ja": "豊洲",   "ko": "도요스"},
    {"key": "ariake",    "city": "13108", "district": "有明",   "ja": "有明",   "ko": "아리아케"},
]
YEARS = 5          # 何年分さかのぼるか
MIN_COUNT = 3      # 四半期あたりの最低件数
TSUBO = 3.305785   # 1坪（㎡）


def fetch(key, city, year, quarter):
    url = f"{API}?year={year}&quarter={quarter}&city={city}"
    req = urllib.request.Request(url, headers={"Ocp-Apim-Subscription-Key": key, "Accept-Encoding": "gzip"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=60) as res:
                body = res.read()
                if res.headers.get("Content-Encoding") == "gzip" or body[:2] == b"\x1f\x8b":
                    body = gzip.decompress(body)
                return json.loads(body).get("data", [])
        except urllib.error.HTTPError as e:
            if e.code == 404:          # その四半期のデータがまだない
                return []
            if e.code in (401, 403):
                sys.exit(f"APIキーが無効です（HTTP {e.code}）")
            err = e
        except urllib.error.URLError as e:
            err = e
        time.sleep(2 ** (attempt + 1))
    raise RuntimeError(f"取得に失敗しました: {url} ({err})")


def tsubo_price(row):
    """坪単価（万円）。面積が「2000㎡以上」のような文字列なら None"""
    try:
        price = float(row["TradePrice"])
        area = float(row["Area"])
    except (KeyError, TypeError, ValueError):
        return None
    if area <= 0:
        return None
    return price / (area / TSUBO) / 10000


def main():
    key = os.environ.get("REINFOLIB_API_KEY")
    if not key:
        sys.exit("環境変数 REINFOLIB_API_KEY を設定してください")

    today = date.today()
    quarters = [(y, q) for y in range(today.year - YEARS, today.year + 1) for q in range(1, 5)
                if (y, q) <= (today.year, (today.month - 1) // 3 + 1)]

    # 地区 → 四半期 → 坪単価のリスト
    prices = {a["key"]: {} for a in AREAS}
    for city in sorted({a["city"] for a in AREAS}):
        targets = [a for a in AREAS if a["city"] == city]
        for y, q in quarters:
            for row in fetch(key, city, y, q):
                if "マンション" not in row.get("Type", ""):
                    continue
                for a in targets:
                    # DistrictName は「勝どき」「豊洲」のように丁目なしで返る
                    if row.get("DistrictName", "").startswith(a["district"]):
                        p = tsubo_price(row)
                        if p is not None:
                            prices[a["key"]].setdefault((y, q), []).append(p)
            time.sleep(0.5)

    # データのある最初と最後の四半期で範囲を切る
    filled = sorted({yq for per in prices.values() for yq, v in per.items() if len(v) >= MIN_COUNT})
    if not filled:
        sys.exit("対象のデータが1件もありませんでした")
    periods = [yq for yq in quarters if filled[0] <= yq <= filled[-1]]

    out = {
        "updated": today.isoformat(),
        "source": "国土交通省 不動産情報ライブラリ（不動産取引価格情報・成約価格情報）",
        "unit": "万円/坪",
        "minCount": MIN_COUNT,
        "periods": [f"{y}Q{q}" for y, q in periods],
        "areas": [],
    }
    for a in AREAS:
        values, counts = [], []
        for yq in periods:
            v = prices[a["key"]].get(yq, [])
            counts.append(len(v))
            values.append(round(statistics.median(v)) if len(v) >= MIN_COUNT else None)
        out["areas"].append({"key": a["key"], "ja": a["ja"], "ko": a["ko"], "values": values, "counts": counts})

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("wrote:", OUT, f"({len(periods)} quarters)")


if __name__ == "__main__":
    main()
