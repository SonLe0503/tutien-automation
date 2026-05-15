import requests
from bs4 import BeautifulSoup

# URL của truyện muốn crawl (Ví dụ)
url = "https://example.com"
# API endpoint của NestJS
api_url = "http://localhost:3000/chapters"

def crawl_and_save():
    print(f"Crawling {url}...")
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    # Giả lập bóc tách dữ liệu (Bạn sẽ thay đổi logic này tùy theo trang web cụ thể)
    chapter_data = {
        "title": soup.title.text if soup.title else "No Title",
        "content": "Nội dung chương truyện crawl được ở đây...",
        "summary": "Tóm tắt ngắn gọn...",
        "sourceUrl": url
    }

    print("Sending data to NestJS API...")
    res = requests.post(api_url, json=chapter_data)
    
    if res.status_code == 201:
        print("Successfully saved to DB!")
        print(res.json())
    else:
        print(f"Failed to save! Status code: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    crawl_and_save()
