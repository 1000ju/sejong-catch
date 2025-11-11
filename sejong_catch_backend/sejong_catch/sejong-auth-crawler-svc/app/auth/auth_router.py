# ==========================================
# app/auth_router.py
# ==========================================

# --- macOS 환경의 TLS 핸드셰이크 문제 회피 코드 ---
# (macOS에서는 urllib3가 기본 SSL 대신 SecureTransport를 써야 오류가 안 나는 경우가 있음)
try:
    import urllib3.contrib.securetransport as st  # type: ignore
    st.inject_into_urllib3()
except Exception:
    # 리눅스/도커 환경에선 필요 없음
    pass


# --- 기본 모듈 및 타입 정의 ---
import os
from typing import Dict, Any, Optional, List

# --- 외부 HTTP 통신용 라이브러리 ---
import requests

# --- FastAPI 핵심 구성요소 ---
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# --- sejong_univ_auth 라이브러리에서 auth 함수와 Manual 세션 불러오기 ---
# (공식 문서 기준: 루트에서 임포트해야 내부 의존성이 정상 작동)
from sejong_univ_auth import auth, Manual


# --- 세종대 SSO용 세션 클래스들 개별 임포트 ---
# (환경마다 없는 세션이 있으므로 try/except로 안전하게 처리)
try:
    from sejong_univ_auth import DosejongSession   # 교양포털 세션 (name/major 잘 나옴)
except Exception:
    DosejongSession = None

try:
    from sejong_univ_auth import MoodlerSession    # e-class 세션 (name/major 잘 나옴)
except Exception:
    MoodlerSession = None

try:
    from sejong_univ_auth import ClassicSession    # 고전독서 세션 (일부 계정에서 오류)
except Exception:
    ClassicSession = None

try:
    from sejong_univ_auth import PortalSSOToken    # 포털 토큰 세션 (최후 fallback)
except Exception:
    PortalSSOToken = None



def _unwrap(x):
    """세션 클래스가 (class, metadata) 튜플일 경우 첫 번째 요소만 반환"""
    if isinstance(x, tuple) and len(x) > 0:
        return x[0]
    return x

# --- 실제 사용할 인증 메서드 체인 정의 ---
#   - 리스트 안에 None 제거
#   - 세션 성공률 순서대로 나열
# _METHODS_CHAIN: List[type] = [
#     m for m in [DosejongSession, MoodlerSession, ClassicSession, PortalSSOToken, Manual]
#     if m is not None
# ]
_METHODS_CHAIN = [
    _unwrap(m)
    for m in [DosejongSession, MoodlerSession, ClassicSession, PortalSSOToken, Manual]
    if m is not None
]




# --- FastAPI 라우터 등록 (prefix="/auth") ---
router = APIRouter(prefix="/auth", tags=["Auth"])


# ==========================================
# 환경 변수 로드
# ==========================================
# NOTE: Node 연동 및 JWT 발급을 Python에서 담당하지 않으므로
#       관련 설정(NODE_BASE, SERVICE_TOKEN, BYPASS_NODE 등)은 제거했다.
EXPOSE_SSO = os.getenv("EXPOSE_SSO", "1") == "1"             # SSO 결과를 응답에 포함할지


# ==========================================
# 데이터 모델 정의 (Pydantic)
# ==========================================

# 로그인 요청 바디 구조
class LoginRequest(BaseModel):
    student_id: str
    password: str

# SSO 결과 구조체 (디버깅용)
class SSOResult(BaseModel):
    success: bool
    is_auth: bool
    code: Optional[Any] = None
    body: Dict[str, Any] = {}

# 로그인 최종 응답 구조체
#   * 이전에는 JWT/linked 정보를 포함했지만,
#     이제 Python은 SSO 결과만 돌려주므로 success/user 필드만 남겼다.
class LoginResponse(BaseModel):
    success: bool
    user: Dict[str, Any]             # name/major/year 포함
    sso: Optional[SSOResult] = None  # 개발 모드일 때만 포함


# --- 여러 값 중 첫 번째 유효값 반환하는 헬퍼 함수 ---
def _first_truthy(*vals):
    for v in vals:
        if v is not None and v != "":
            return v
    return None


# ==========================================
# 실제 로그인 API
# ==========================================
@router.post(
    "/sessions",
    response_model=LoginResponse,
    status_code=201,
    summary="세종대 SSO 로그인(학번·비번)"
)
async def create_session(req: LoginRequest):
    """
    1) 세종대 인증: 여러 SSO 세션을 순차적으로 시도
       (Dosejong → Moodler → Classic → Portal → Manual)
    2) 인증 결과와 사용자 기초 정보를 정리해 반환
       (JWT 발급 및 DB 업서트는 Node 서비스가 담당)
    """

    # ---------- (1) 세종대 인증 수행 ----------
    try:
        # sejong_univ_auth의 auth() 함수는 동기 방식.
        # 여러 세션 클래스를 methods 리스트로 넘기면 자동으로 순차 시도.
        result = auth(id=req.student_id, password=req.password, methods=_METHODS_CHAIN)
    except requests.exceptions.SSLError as e:
        # SSL 인증서 문제 시 502 반환
        raise HTTPException(status_code=502, detail={"code": "SSL_ERROR", "message": str(e)})
    except requests.exceptions.RequestException as e:
        # 외부 요청 오류 (연결 실패 등)
        raise HTTPException(status_code=502, detail={"code": "UPSTREAM_ERROR", "message": str(e)})

    # 인증 성공 여부 판단
    ok = bool(getattr(result, "success", False)) and bool(getattr(result, "is_auth", False))

    # ---------- (2) 프로필(name/major/year) 추출 ----------
    sso_body: Dict[str, Any] = (getattr(result, "body", {}) or {})
    name: Optional[str] = _first_truthy(sso_body.get("name"))
    major: Optional[str] = _first_truthy(sso_body.get("major"))
    year_raw = sso_body.get("year")

    try:
        # year 값이 문자열이라도 숫자면 int 변환
        year: Optional[int] = int(year_raw) if year_raw is not None and str(year_raw).isdigit() else None
    except Exception:
        year = None

    # ---------- (3) 인증 실패 시 401 반환 ----------
    if not ok:
        # 개발 모드일 경우 SSO 원본(body/code)을 응답에 포함
        sso_data = SSOResult(
            success=bool(getattr(result, "success", False)),
            is_auth=bool(getattr(result, "is_auth", False)),
            code=getattr(result, "code", None),
            body=sso_body,
        ) if EXPOSE_SSO else None

        raise HTTPException(
            status_code=401,
            detail={
                "code": "AUTH_FAILED",
                "message": "Invalid credentials",
                "sso": sso_data.model_dump() if sso_data else None,
            },
        )

    # ---------- (4) Node 연동 제거 ----------
    # 이전 버전에서는 여기서 Node 내부 API를 호출하고 JWT를 발급했지만,
    # 현재는 Python이 SSO 인증 결과만 반환하도록 책임을 축소했다.
    # user_id는 단순히 student_id 기반 식별자로 구성한다.
    user_id = f"u_{req.student_id}"

    # ---------- (5) 응답 생성 ----------
    resp_user: Dict[str, Any] = {
        "id": user_id,
        "student_id": req.student_id,
        "role": "student",
    }
    if name:
        resp_user["name"] = name
    if major:
        resp_user["major"] = major
    if year is not None:
        resp_user["year"] = year

    # 개발 중일 경우 SSO 결과를 그대로 응답에 포함
    sso_data = SSOResult(
        success=bool(getattr(result, "success", False)),
        is_auth=bool(getattr(result, "is_auth", False)),
        code=getattr(result, "code", None),
        body=sso_body,
    ) if EXPOSE_SSO else None

    # 최종 반환
    # ok가 False였다면 이미 401 예외로 종료되었지만,
    # 의미를 명확히 하기 위해 success 필드에 해당 값을 그대로 넣는다.
    return LoginResponse(
        success=ok,
        user=resp_user,
        sso=sso_data,
    )
