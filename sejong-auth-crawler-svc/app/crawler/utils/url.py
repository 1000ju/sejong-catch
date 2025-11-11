# app/crawler/utils/url.py
from urllib.parse import urlencode, urljoin
from app.crawler.config.settings import BASE_URL, LIST_PATH_TMPL, DEFAULT_LIMIT

def build_list_url(notice_key: str, offset: int, limit: int = DEFAULT_LIMIT) -> str:
    """
    카테고리 notice_key(예: 'notice1')와 offset으로 목록 URL 생성
    """
    path = LIST_PATH_TMPL.format(notice=notice_key)
    query = urlencode({
        "mode": "list",
        "articleLimit": limit,
        "article.offset": offset,
    })
    return urljoin(BASE_URL, f"{path}?{query}")

#https://www.sejong.ac.kr/kor/intro/notice2.do?mode=list&&articleLimit=10&article.offset=10