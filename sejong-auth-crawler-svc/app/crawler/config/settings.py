# app/crawler/config/settings.py
"""
크롤러 기본 설정값 (MVP 버전)
- 이후에 .env 연동/도커 환경변수 주입으로 확장 예정
"""

BASE_URL = "https://www.sejong.ac.kr"


# 목록 페이지 경로 템플릿 (noticeX만 바꿔 끼우면 카테고리 전환)
LIST_PATH_TMPL = "/kor/intro/{notice}.do"

# 카테고리 키 매핑 
CATEGORY_MAP = {
    "일반공지": "notice1",
    "입학공지": "notice2",
    "학사공지": "notice3",
    "국제교류(KR)": "notice4",
    "국제교류(EN)": "notice5",
    "취업": "notice6",
    "장학": "notice7",
    "교내모집": "notice8",
    "법무감사": "notice9",
    "입찰공고": "notice10",
}

# 페이지네이션/요청 기본값
DEFAULT_LIMIT = 10          # articleLimit
OFFSET_STEP = 10            # article.offset 증분 (0, 10, 20, ...)
REQUEST_TIMEOUT = 10        # 초
RETRY_COUNT = 2             # 간단 재시도 횟수(MVP)
SLEEP_RANGE = (0.3, 0.8)    # 요청 간 랜덤 슬립(초) — 예의 지키기
USER_AGENT = (
    "Mozilla/5.0 (compatible; SejongCatchBot/0.1; +https://github.com/your-org/your-repo)"
)
