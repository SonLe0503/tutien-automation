import requests
import time
import re
from bs4 import BeautifulSoup

STORY_URL = "http://vietnamthuquan.eu/truyen/truyen.aspx?tid=2qtqv3m3237n1nnntn2nnn31n343tq83a3q3m3237nvn"
CHAPTER_API = "http://vietnamthuquan.eu/truyen/chuonghoi_moi.aspx?"
NESTJS_API = "http://localhost:3000/chapters"
RESPONSE_SEPARATOR = "--!!tach_noi_dung!!--"

# Số chương mới nhất cần crawl mỗi lần chạy (cron mode)
CRAWL_LIMIT = 5


def make_session():
    session = requests.Session()
    session.max_redirects = 5
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
    })
    return session


def get_chapter_list(session):
    """Fetch story page và trả về list chapters [{tuaid, chuongid, title, label}]"""
    resp = session.get(STORY_URL, timeout=25, allow_redirects=True)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    chapters = []
    for li in soup.find_all("li", onclick=True):
        onclick = li.get("onclick", "")
        m = re.search(r"tuaid=(\d+)&chuongid=(\d+)", onclick)
        if not m:
            continue
        tuaid = m.group(1)
        chuongid = int(m.group(2))
        acronym = li.find_parent("acronym")
        title = acronym.get("title", "") if acronym else ""
        label = li.find("a").text.strip() if li.find("a") else f"Chương {chuongid}"
        chapters.append({
            "tuaid": tuaid,
            "chuongid": chuongid,
            "title": title,
            "label": label,
        })

    return chapters


def fetch_chapter_content(session, tuaid, chuongid):
    """Gọi AJAX API và trả về (title, content)"""
    resp = session.post(
        CHAPTER_API,
        data=f"tuaid={tuaid}&chuongid={chuongid}",
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": STORY_URL,
            "X-Requested-With": "XMLHttpRequest",
        },
        timeout=20,
    )
    resp.raise_for_status()

    parts = resp.text.split(RESPONSE_SEPARATOR)
    if len(parts) < 3:
        raise ValueError(f"Unexpected response format: {len(parts)} parts")

    # Part 1: title block, Part 2: content
    title_soup = BeautifulSoup(parts[1], "html.parser")
    content_soup = BeautifulSoup(parts[2], "html.parser")

    title = title_soup.get_text(separator=" ", strip=True)
    content = content_soup.get_text(separator="\n", strip=True)
    return title, content


def chapter_source_url(tuaid, chuongid):
    return f"http://vietnamthuquan.eu/truyen/23543/chuong-{chuongid}"


def save_chapter(chapter_data):
    """POST chapter lên NestJS API"""
    resp = requests.post(NESTJS_API, json=chapter_data, timeout=15)
    return resp.status_code, resp.text


def crawl_latest(limit=CRAWL_LIMIT):
    print(f"[crawler] Starting crawl — limit={limit}")
    session = make_session()

    print("[crawler] Fetching chapter list...")
    chapters = get_chapter_list(session)
    print(f"[crawler] Found {len(chapters)} chapters total")

    # Crawl `limit` chapters mới nhất (cuối list)
    targets = chapters[-limit:]

    saved = 0
    skipped = 0
    for ch in targets:
        source_url = chapter_source_url(ch["tuaid"], ch["chuongid"])
        try:
            title, content = fetch_chapter_content(session, ch["tuaid"], ch["chuongid"])
            full_title = f"{ch['label']} — {ch['title']}" if ch["title"] else ch["label"]

            status, body = save_chapter({
                "title": full_title,
                "content": content,
                "sourceUrl": source_url,
            })

            if status == 201:
                print(f"[crawler] Saved: {full_title}")
                saved += 1
            elif status == 200:
                print(f"[crawler] Updated: {full_title}")
                saved += 1
            else:
                print(f"[crawler] Failed ({status}): {full_title} — {body[:100]}")
                skipped += 1

        except Exception as e:
            print(f"[crawler] Error on chuongid={ch['chuongid']}: {e}")
            skipped += 1

        time.sleep(1)  # rate limit

    print(f"[crawler] Done — saved={saved} skipped={skipped}")


if __name__ == "__main__":
    crawl_latest()
