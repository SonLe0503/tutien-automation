import requests
import time
import re
from bs4 import BeautifulSoup

NESTJS_API = "http://localhost:3000/chapters"
NESTJS_SOURCE_URLS_API = "http://localhost:3000/chapters/source-urls"
NESTJS_STORIES_API = "http://localhost:3000/stories/active"

BATCH_SIZE = 1


# ─── Session ─────────────────────────────────────────────────────────────────

def make_session():
    session = requests.Session()
    session.max_redirects = 5
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
    })
    return session


# ─── NestJS helpers ───────────────────────────────────────────────────────────

def get_saved_source_urls():
    try:
        resp = requests.get(NESTJS_SOURCE_URLS_API, timeout=10)
        resp.raise_for_status()
        return set(resp.json())
    except Exception as e:
        print(f"[crawler] Warning: could not fetch saved URLs ({e})")
        return set()


def get_active_stories():
    try:
        resp = requests.get(NESTJS_STORIES_API, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"[crawler] Warning: could not fetch stories ({e})")
        return []


def save_chapter(chapter_data):
    resp = requests.post(NESTJS_API, json=chapter_data, timeout=15)
    return resp.status_code, resp.text


# ─── Parser: vietnamthuquan ───────────────────────────────────────────────────

VTQ_CHAPTER_API = "http://vietnamthuquan.eu/truyen/chuonghoi_moi.aspx?"
VTQ_SEPARATOR = "--!!tach_noi_dung!!--"


def vtq_get_chapter_list(session, story):
    resp = session.get(story["indexUrl"], timeout=25, allow_redirects=True)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    chapters = []
    for li in soup.find_all("li", onclick=True):
        m = re.search(r"tuaid=(\d+)&chuongid=(\d+)", li.get("onclick", ""))
        if not m:
            continue
        tuaid = m.group(1)
        chuongid = int(m.group(2))
        acronym = li.find_parent("acronym")
        title = acronym.get("title", "") if acronym else ""
        label = li.find("a").text.strip() if li.find("a") else f"Chương {chuongid}"
        source_url = f"http://vietnamthuquan.eu/truyen/{tuaid}/chuong-{chuongid}"
        chapters.append({
            "tuaid": tuaid, "chuongid": chuongid,
            "title": title, "label": label,
            "sourceUrl": source_url,
        })
    return chapters


def vtq_fetch_content(session, story, chapter):
    resp = session.post(
        VTQ_CHAPTER_API,
        data=f"tuaid={chapter['tuaid']}&chuongid={chapter['chuongid']}",
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "Referer": story["indexUrl"],
            "X-Requested-With": "XMLHttpRequest",
        },
        timeout=20,
    )
    resp.raise_for_status()
    parts = resp.text.split(VTQ_SEPARATOR)
    if len(parts) < 3:
        raise ValueError(f"Unexpected VTQ response: {len(parts)} parts")
    content = BeautifulSoup(parts[2], "html.parser").get_text(separator="\n", strip=True)
    full_title = f"{chapter['label']} — {chapter['title']}" if chapter["title"] else chapter["label"]
    return full_title, content


# ─── Parser: truyenfull ───────────────────────────────────────────────────────

def truyenfull_get_chapter_list(session, story):
    resp = session.get(story["indexUrl"], timeout=20)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    max_chap = 0
    for a in soup.find_all("a", href=True):
        m = re.search(r"chuong-(\d+)", a["href"])
        if m:
            max_chap = max(max_chap, int(m.group(1)))

    slug_m = re.search(r"truyenfull\.today/([^/]+)/", story["indexUrl"])
    slug = slug_m.group(1) if slug_m else "truyen"

    chapters = []
    for i in range(1, max_chap + 1):
        source_url = f"https://truyenfull.today/{slug}/chuong-{i}/"
        chapters.append({"chuongid": i, "slug": slug, "sourceUrl": source_url})
    return chapters


def truyenfull_fetch_content(session, story, chapter):
    resp = session.get(chapter["sourceUrl"], timeout=20)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    content_el = soup.find(id="chapter-c") or soup.find(class_="chapter-c")
    if not content_el:
        raise ValueError("Content element not found")

    title_tag = soup.find("title")
    full_title = title_tag.text.strip().split(" - ")[0] if title_tag else f"Chương {chapter['chuongid']}"
    content = content_el.get_text(separator="\n", strip=True)
    return full_title, content


# ─── Dispatcher ──────────────────────────────────────────────────────────────

PARSERS = {
    "vietnamthuquan": (vtq_get_chapter_list, vtq_fetch_content),
    "truyenfull": (truyenfull_get_chapter_list, truyenfull_fetch_content),
}


def crawl_story(session, story, saved_urls):
    domain = story["domain"]
    if domain not in PARSERS:
        print(f"[crawler] Unknown domain '{domain}' for story '{story['name']}', skipping")
        return

    get_list, fetch_content = PARSERS[domain]

    print(f"[crawler] [{story['name']}] Fetching chapter list...")
    chapters = get_list(session, story)
    print(f"[crawler] [{story['name']}] Total: {len(chapters)} | In DB: {len(saved_urls)}")

    unsaved = [ch for ch in chapters if ch["sourceUrl"] not in saved_urls]
    targets = unsaved[:BATCH_SIZE]
    print(f"[crawler] [{story['name']}] Unsaved: {len(unsaved)} | Crawling: {len(targets)}")

    if not targets:
        print(f"[crawler] [{story['name']}] Nothing new.")
        return

    saved = 0
    skipped = 0
    for ch in targets:
        try:
            title, content = fetch_content(session, story, ch)
            status, body = save_chapter({
                "title": title,
                "content": content,
                "sourceUrl": ch["sourceUrl"],
                "storyId": story["id"],
            })
            if status == 201:
                print(f"[crawler]   + {title[:70]}")
                saved += 1
            else:
                print(f"[crawler]   x ({status}) {title[:60]} — {body[:80]}")
                skipped += 1
        except Exception as e:
            print(f"[crawler]   x Error chuongid={ch.get('chuongid')}: {e}")
            skipped += 1
        time.sleep(1)

    print(f"[crawler] [{story['name']}] Done — saved={saved} skipped={skipped}")


# ─── Main ─────────────────────────────────────────────────────────────────────

def group_by_book(stories):
    """Group stories theo bookSlug, sort mỗi group theo priority."""
    groups = {}
    for s in stories:
        book = s.get("bookSlug", s["slug"])
        groups.setdefault(book, []).append(s)
    for book in groups:
        groups[book].sort(key=lambda s: s.get("priority", 1))
    return groups


def crawl_latest():
    print("[crawler] Starting crawl")
    session = make_session()

    stories = get_active_stories()
    if not stories:
        print("[crawler] No active stories found.")
        return

    saved_urls = get_saved_source_urls()
    book_groups = group_by_book(stories)
    print(f"[crawler] Books: {len(book_groups)} | Sources: {len(stories)}")

    for book_slug, sources in book_groups.items():
        print(f"\n[crawler] Book: {book_slug}")
        success = False
        for source in sources:
            label = f"{source['name']} (priority={source.get('priority',1)})"
            try:
                crawl_story(session, source, saved_urls)
                success = True
                break  # primary ok, không cần fallback
            except Exception as e:
                print(f"[crawler]   ! {label} failed: {e}")
                print(f"[crawler]   > Trying next source...")

        if not success:
            print(f"[crawler]   !! All sources failed for book '{book_slug}'")

    print("\n[crawler] All books processed.")


if __name__ == "__main__":
    crawl_latest()
