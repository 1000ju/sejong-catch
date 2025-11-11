# Dockerfile, docker-compose.yml도 수정해야함

# app/crawl_scheduler.py
# ---------------------------------------------------------------------------
#  간단한 크롤링 스케줄러
#    - CATEGORY_MAP에 정의된 카테고리별로 목록 페이지를 조회하고
#      list_parser.parse_list()로 공지 항목(title, href, date)을 추출한다.
#    - 개발 단계용 유틸리티이므로 현재는 결과를 로그로만 남긴다.
#    - 반복 실행 옵션과 페이지 수는 환경 변수(CRAWLER_*)로 조절할 수 있다.
# ---------------------------------------------------------------------------
from __future__ import annotations

import logging
import os
import time
from pathlib import Path
from typing import Iterable

from dotenv import load_dotenv

from app.crawler.config.settings import CATEGORY_MAP, DEFAULT_LIMIT, OFFSET_STEP
from app.crawler.http import client
from app.crawler.parser.list_parser import parse_list
from app.crawler.utils.url import build_list_url

# 레포 루트의 .env를 읽어서 (PORT, SSO 옵션 등) 기존 설정을 재사용한다.
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH, override=False)

# 실행 옵션: 환경변수 값이 없으면 개발용 기본값을 사용한다.
DEFAULT_PAGES_PER_CATEGORY = int(os.getenv("CRAWLER_PAGES_PER_CATEGORY", "1"))
DEFAULT_INTERVAL_SEC = int(os.getenv("CRAWLER_INTERVAL_SEC", "600"))
DEFAULT_LOOP = os.getenv("CRAWLER_LOOP", "0") == "1" #자동반복 실행 여부

logger = logging.getLogger("crawl_scheduler")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)


def _iter_offsets(pages: int) -> Iterable[int]:
    """페이지 수에 맞춰 offset 값들을 생성한다."""
    for page in range(pages):
        yield OFFSET_STEP * page


def fetch_category_page(category: str, notice_key: str, offset: int) -> list[dict]:
    """
    단일 카테고리/offset에 해당하는 목록 페이지를 요청해 파싱 결과를 반환한다.
    HTTP 오류가 발생하면 requests.RequestException이나 HTTPError를 그대로 전파한다.
    """
    url = build_list_url(notice_key, offset, limit=DEFAULT_LIMIT) # 목록 URL 생성
    logger.debug("Fetch %s offset=%s url=%s", category, offset, url)

    response = client.get(url) # HTTP GET 요청
    response.raise_for_status()  # 4xx/5xx 응답이면 즉시 예외 발생

    items = parse_list(response.text) # HTML 파싱
    logger.info("Fetched %s offset=%s → %s items", category, offset, len(items))# 로그 기록
    return items # 파싱된 항목 반환


def run_once(pages_per_category: int = DEFAULT_PAGES_PER_CATEGORY) -> None:
    """
    모든 카테고리를 한 번씩 순회하며 지정한 페이지 수만큼 목록을 수집한다.
    현재는 파싱된 항목을 로그로만 기록한다.
    """
    for category, notice_key in CATEGORY_MAP.items():
        for offset in _iter_offsets(pages_per_category):
            try:
                items = fetch_category_page(category, notice_key, offset) # 페이지 요청 및 파싱
                for item in items:
                    logger.debug("%s | %s", category, item) # 파싱된 항목 로그 기록
            except Exception:
                logger.exception("Failed to crawl %s (offset=%s)", category, offset)
                # 한 페이지 실패가 전체 흐름을 막지 않도록 다음 항목으로 계속 진행
                continue


def run_scheduler(
    *,
    pages_per_category: int = DEFAULT_PAGES_PER_CATEGORY,
    interval_sec: int = DEFAULT_INTERVAL_SEC,
    loop: bool = DEFAULT_LOOP,
) -> None:
    """
    크롤링을 주기적으로 실행한다.
    loop=False면 run_once만 호출하고 종료한다.
    """
    iteration = 0
    while True:
        iteration += 1 # 반복 횟수 증가
        logger.info("Crawl iteration %s start", iteration)
        run_once(pages_per_category=pages_per_category) # 단일 크롤링 실행
        logger.info("Crawl iteration %s complete", iteration)

        if not loop:
            break

        logger.info("Sleeping %s seconds before next iteration", interval_sec)
        time.sleep(interval_sec)


if __name__ == "__main__":
    run_scheduler()


# 2025-11-04 16:18:03,273 [INFO] crawl_scheduler - Fetched 입찰공고 offset=90 → 1 items
# https://www.sejong.ac.kr/kor/intro/notice10.do?mode=view&articleNo=858789&article.offset=0&articleLimit=10
# url 구성이 조금 달라서 파싱이 안되는 항목이 있음 -> 별도의 파서를 각각 구성해주면 됨


# 1. 별도 파서 구성해서 전부 파싱하도록 개선
# 2. dockerfile, docker-compose.yml 수정해서 도커 환경에서 스케줄러 실행 가능하도록 개선
# 3. db 연동해서 크롤링한 데이터 저장하도록 개선