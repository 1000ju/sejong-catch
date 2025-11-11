# app/crawler/parser/list_parser.py
from __future__ import annotations
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime
from app.crawler.config.settings import BASE_URL

def _normalize_date(raw: str) -> str:
    """
    날짜 표기를 YYYY-MM-DD로 정규화. 실패하면 원문 반환.
    사이트 표기 예: '2025-11-04', '2025.11.04', '2025/11/04'
    """
    s = (raw or "").strip()
    for fmt in ("%Y-%m-%d", "%Y.%m.%d", "%Y/%m/%d"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return s

def parse_list(html: str) -> list[dict]:
    """
    목록 HTML → 최소 필드만 추출하는 MVP 파서
    반환: [{title, href(절대), date}, ...]
    * CSS 셀렉터는 사이트 구조 변경 시 한 번만 고치면 됨.
    """
    soup = BeautifulSoup(html, "lxml")  # lxml 미설치면 "html.parser"로 변경 가능
    rows = soup.select("tbody tr")
    items: list[dict] = []

    for tr in rows:
        # 제목/링크: 일반적으로 2번째 TD에 <a>가 위치
        a = tr.select_one("td:nth-child(2) a")
        if not a:
            # 다른 구조(클래스명 subject 등)로 노출되는 경우 대비
            a = tr.select_one("td a, a")
        if not a:
            continue

        title = a.get_text(strip=True)
        href_raw = a.get("href", "").strip()
        href = urljoin(BASE_URL, href_raw)

        # 날짜: 일반적으로 4번째 TD에 존재
        date_td = tr.select_one("td:nth-child(4)")
        date_raw = date_td.get_text(strip=True) if date_td else ""
        date = _normalize_date(date_raw)

        if title and href:
            items.append({"title": title, "href": href, "date": date})

    return items

# 파싱해야하는거 -> <a> href, title <span> b-date


# 조건 : notice2의 종류와 href가 하나의 조합.
href="?mode=view&articleNo=803088&article.offset=20&articleLimit=10"
