import os
from pathlib import Path

# 1) .env 강제 로드 (app/의 상위 폴더가 sejong-auth-svc)
from dotenv import load_dotenv
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"   # sejong-auth-svc/.env
load_dotenv(ENV_PATH)

from fastapi import FastAPI
from .auth.auth_router import router as auth_router

app = FastAPI(title="Sejong Auth Service", version="1.0.0")
app.include_router(auth_router)

@app.get("/healthz")
def health():
    # 2) 로딩된 .env 일부를 노출하지 않는 선에서 확인 용도(원하면 삭제 가능)
    return {
        "ok": True,
        "version": "1.0.0",
        "env_loaded": ENV_PATH.exists(),
        "port": int(os.getenv("PORT", "8081")),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8081")),
        reload=True,
    )
