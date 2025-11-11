FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# TLS 인증서 최신화 (핸드셰이크 이슈 예방)
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 의존성만 설치 (패키징 안 함)
# - requests/urllib3 핀 고정: 맥 OpenSSL 핸드셰이크 이슈 회피
# - pydantic[email] (== email-validator 포함)
COPY requirements.txt ./requirements.txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 앱 코드
COPY app ./app

EXPOSE 8081

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8081"]
