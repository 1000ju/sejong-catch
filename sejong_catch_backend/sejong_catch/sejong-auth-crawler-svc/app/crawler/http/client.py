# app/crawler/http/client.py
# ---------------------------------------------------------------------------
#  Sejong 캐치 크롤러에서 HTTP 요청을 보낼 때 사용하는 얇은 래퍼.
#  - requests.Session을 재사용해 TCP 커넥션을 유지하고
#  - 타임아웃, 재시도, 랜덤 슬립 등 최소한의 예외 처리를 묶어 둔다.
# ---------------------------------------------------------------------------
import random  # 요청 간 랜덤 슬립 계산에 사용
import time    # sleep 함수 사용

import requests
from requests import Response

from app.crawler.config.settings import (
    REQUEST_TIMEOUT,
    RETRY_COUNT,
    SLEEP_RANGE,
    USER_AGENT,
)

# 전역 세션 객체: 커넥션을 재사용해서 성능·자원 사용을 개선한다.
_session = requests.Session()
# 사이트에서 봇을 식별할 수 있도록 사용자 정의 User-Agent 헤더를 붙인다.
_session.headers.update({"User-Agent": USER_AGENT})


def get(url: str) -> Response:
    """
    주어진 URL을 GET으로 호출한다.
    - 요청에 실패하면 RETRY_COUNT만큼 재시도한다.
    - 각 요청 사이에는 SLEEP_RANGE 범위에서 랜덤 슬립을 넣어 서버에 부담을 줄인다.
    - 모든 재시도가 실패하면 마지막 예외를 그대로 던진다.
    """
    last_exc = None  # 마지막 RequestException을 저장해 두었다가 실패 시 재던짐
    for attempt in range(1, RETRY_COUNT + 1):
        try:
            # allow_redirects=True로 설정해 30x 응답도 따라가도록 한다.
            resp = _session.get(url, timeout=REQUEST_TIMEOUT, allow_redirects=True)
            # 요청이 성공하면 잠시 쉬었다가 응답을 반환한다.
            time.sleep(random.uniform(*SLEEP_RANGE))
            return resp
        except requests.RequestException as e:
            last_exc = e
            # 네트워크 오류 등으로 실패했으니 소폭의 백오프 후 재시도한다.
            time.sleep(min(0.5 * attempt, 1.5))
    # 모든 시도가 실패했다면 마지막으로 발생한 예외를 호출자에게 전달한다.
    raise last_exc
