# 🔐 GitHub Actions Secrets 설정 가이드

> **⚠️ 중요**: 이 설정을 완료해야 CI/CD가 제대로 작동해요! 치킨 주문하듯 차근차근 따라해주세요! 🍗

## 📋 목차
1. [Android 서명 키 생성](#1-android-서명-키-생성)
2. [GitHub Secrets 설정](#2-github-secrets-설정)
3. [설정 검증 방법](#3-설정-검증-방법)
4. [트러블슈팅](#4-트러블슈팅)

---

## 1. 🤖 Android 서명 키 생성

### 1-1. 키스토어 파일 생성
```bash
# Android Studio나 터미널에서 실행
cd sejong_catch-frontend/android/app

# 키스토어 생성 (한번만!)
keytool -genkey -v -keystore sejong-catch-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias sejong-catch-key

# 질문 답변 예시:
# 이름과 성: Sejong Catch Team
# 조직 단위: IT Department
# 조직: Sejong University
# 구/군/시: Seoul
# 시/도: Seoul
# 국가 코드: KR
```

### 1-2. 키스토어 Base64 인코딩
```bash
# 키스토어를 Base64로 변환 (GitHub Secrets용)
base64 -i keystore.jks -o keystore.base64.txt

# macOS/Linux
base64 keystore.jks > keystore.base64.txt

# Windows (PowerShell)
[Convert]::ToBase64String([IO.File]::ReadAllBytes("keystore.jks")) > keystore.base64.txt
```

### 1-3. key.properties 파일 생성
```bash
# android/key.properties 파일 생성
cat > android/key.properties << 'EOF'
storePassword=여러분이설정한키스토어비밀번호
keyPassword=여러분이설정한키비밀번호  
keyAlias=sejong-catch-key
storeFile=keystore.jks
EOF
```

---

## 2. 🔐 GitHub Secrets 설정

### 2-1. GitHub 리포지토리 설정 페이지 접근
1. GitHub 리포지토리로 이동
2. **Settings** 탭 클릭
3. 왼쪽 사이드바에서 **Secrets and variables** → **Actions** 클릭
4. **New repository secret** 버튼 클릭

### 2-2. 필요한 Secrets 설정

#### 🤖 Android 관련 Secrets

| Secret Name | 값 | 설명 |
|-------------|-----|------|
| `ANDROID_KEYSTORE_BASE64` | keystore.base64.txt 파일 내용 전체 | 키스토어 파일 (Base64) |
| `ANDROID_KEYSTORE_PASSWORD` | 키스토어 비밀번호 | 키스토어 생성 시 입력한 비밀번호 |
| `ANDROID_KEY_ALIAS` | `sejong-catch-key` | 키 별칭 (위에서 설정한 값) |
| `ANDROID_KEY_PASSWORD` | 키 비밀번호 | 키 생성 시 입력한 비밀번호 |

#### 🌐 배포 관련 Secrets (선택적)

| Secret Name | 값 | 설명 |
|-------------|-----|------|
| `GH_TOKEN` | GitHub Personal Access Token | 릴리즈 생성용 (자동 생성되므로 생략 가능) |

---

## 3. ✅ 설정 검증 방법

### 3-1. 로컬에서 서명된 APK 빌드 테스트
```bash
cd sejong_catch-frontend

# 서명된 릴리즈 APK 빌드
flutter build apk --release

# 빌드 성공 확인
ls -la build/app/outputs/flutter-apk/
# app-release.apk 파일이 있어야 함!
```

### 3-2. GitHub Actions 테스트
```bash
# frontend 브랜치에 간단한 변경 후 push
git checkout frontend
echo "# CI/CD 테스트" >> test_ci.md
git add .
git commit -m "test: CI/CD 파이프라인 테스트"
git push origin frontend

# GitHub Actions 탭에서 워크플로우 실행 확인!
```

---

## 4. 🚨 트러블슈팅

### 4-1. 자주 발생하는 문제들

#### 🔴 "Keystore file not found" 에러
**원인**: 키스토어 Base64 인코딩 문제
```bash
# 해결 방법: 다시 인코딩
base64 -w 0 keystore.jks > keystore.base64.txt  # Linux
base64 keystore.jks > keystore.base64.txt        # macOS
```

#### 🔴 "Wrong password" 에러  
**원인**: GitHub Secrets의 비밀번호가 잘못됨
- GitHub Secrets에서 `ANDROID_KEYSTORE_PASSWORD`와 `ANDROID_KEY_PASSWORD` 재확인
- 특수문자나 공백이 포함되었는지 확인

#### 🔴 "Permission denied" 에러
**원인**: GitHub Actions 권한 문제
```yaml
# 워크플로우 파일에 권한 추가
permissions:
  contents: write
  actions: read
```

### 4-2. 디버깅 팁

#### 🔍 로그 확인 방법
```bash
# GitHub Actions 로그에서 확인할 포인트:
# 1. Flutter 환경 설정 성공
# 2. 의존성 설치 성공  
# 3. 키스토어 디코딩 성공
# 4. 빌드 프로세스 완료
```

#### 🧪 테스트 명령어
```bash
# 로컬에서 워크플로우와 동일한 명령어 실행
flutter doctor -v
flutter pub get
flutter analyze
flutter test
flutter build apk --release
```

---

## 5. 🎯 추가 최적화 팁

### 5-1. 빌드 속도 향상
```yaml
# .github/workflows/flutter-ci.yml에서 캐시 활용
- name: Cache Flutter dependencies
  uses: actions/cache@v3
  with:
    path: ~/.pub-cache
    key: ${{ runner.os }}-pub-${{ hashFiles('**/pubspec.lock') }}
    restore-keys: ${{ runner.os }}-pub-
```

### 5-2. 보안 강화
- 키스토어 파일은 절대 Git에 커밋하지 마세요!
- `.gitignore`에 다음 추가:
```
# Android 서명 관련 파일
android/keystore.jks
android/key.properties
*.keystore
*.jks
keystore.base64.txt
```

---

## 6. 🎉 완료 체크리스트

- [ ] 키스토어 파일 생성 완료
- [ ] Base64 인코딩 완료  
- [ ] GitHub Secrets 4개 모두 설정
- [ ] 로컬 릴리즈 빌드 테스트 성공
- [ ] GitHub Actions 워크플로우 실행 성공
- [ ] APK 파일이 Artifacts에 업로드됨

---

**🍗 축하해요!** 모든 설정이 완료됐다면 이제 치킨 시켜도 될 것 같네요! CI/CD 파이프라인이 한식당 서비스처럼 완벽하게 돌아갈 거예요! 🚀

## 📞 도움이 필요하다면?

문제가 생기면 GitHub Issues에 다음 정보와 함께 문의해주세요:
- 에러 메시지 전체
- GitHub Actions 로그 스크린샷
- 사용한 Flutter 버전
- 운영체제 정보

**Happy Coding! 🎯**