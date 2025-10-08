# 🚀 TrendFeed 설치 및 실행 가이드

## 📋 목차
1. [사전 요구사항](#사전-요구사항)
2. [레포지토리 클론](#레포지토리-클론)
3. [백엔드 설정](#백엔드-설정)
4. [데이터베이스 설정](#데이터베이스-설정)
5. [실행](#실행)
6. [테스트](#테스트)
7. [문제 해결](#문제-해결)

---

## 📌 사전 요구사항

### 필수 설치 항목
- **Node.js** (v14 이상): https://nodejs.org/
- **Git**: https://git-scm.com/
- **웹 브라우저**: Chrome, Firefox, Edge 등

### 선택 설치 항목
- **VSCode**: https://code.visualstudio.com/ (추천)
- **Live Server** (VSCode 확장): 프론트엔드 개발용

---

## 1️⃣ 레포지토리 클론

```bash
# 레포지토리 클론
git clone <repository-url>
cd Beta_Production

# 디렉토리 구조 확인
dir
```

**예상 디렉토리 구조:**
```
Beta_Production/
├── Frontend/          # 프론트엔드 파일
│   ├── index.html
│   ├── dashboard.html
│   ├── timeline.html
│   └── styles.css
├── backend/           # 백엔드 API 및 워커
│   ├── server.js
│   ├── config.js
│   ├── package.json
│   ├── workers/
│   └── database/
├── README.md
└── DATA_SOURCES.md
```

---

## 2️⃣ 백엔드 설정

### Step 1: 백엔드 디렉토리로 이동
```bash
cd backend
```

### Step 2: 의존성 패키지 설치
```bash
npm install
```

**예상 출력:**
```
added 271 packages, and audited 272 packages in 15s
```

⚠️ **주의**: 경고 메시지는 무시해도 됩니다.

### Step 3: 환경 변수 설정 (선택사항)

**기본 설정으로 작동합니다!** Supabase 키가 이미 `config.js`에 포함되어 있습니다.

**선택사항: Reddit API 추가** (더 많은 데이터를 원할 경우)

1. Reddit 앱 생성: https://www.reddit.com/prefs/apps
2. `backend/.env` 파일 생성:
```env
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=TrendFeed/1.0
```

**Reddit 없이도 작동합니다!** GitHub, arXiv, Hacker News, RSS 피드만으로도 충분한 데이터가 수집됩니다.

---

## 3️⃣ 데이터베이스 설정

### Step 1: Supabase 대시보드 접속
```
https://supabase.com/dashboard/project/hjmbrmdpvcrzthkxwjhm
```

⚠️ **계정이 필요합니다!** 프로젝트 소유자에게 접근 권한을 요청하세요.

### Step 2: SQL 스키마 실행

1. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
2. **"New Query"** 버튼 클릭
3. `backend/database/schema.sql` 파일 열기
4. **전체 내용 복사** (Ctrl+A → Ctrl+C)
5. Supabase SQL Editor에 **붙여넣기** (Ctrl+V)
6. 초록색 **"Run"** 버튼 클릭

**예상 출력:**
```
Success. No rows returned
```

### Step 3: 테이블 생성 확인

1. 왼쪽 메뉴에서 **"Table Editor"** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ sources
   - ✅ raw_articles
   - ✅ extracted_keywords
   - ✅ canonical_trends
   - ✅ trend_scores
   - ✅ users
   - ✅ agents
   - ✅ keywords
   - ✅ archived_keywords

---

## 4️⃣ 실행

### 방법 1: 자동 실행 (추천)

**Windows:**
```bash
# 프로젝트 루트 디렉토리에서
start-backend.bat
```

이 명령어는 자동으로:
- ✅ 의존성 설치
- ✅ 데이터베이스 설정
- ✅ API 서버 시작
- ✅ 데이터 수집 워커 시작

### 방법 2: 수동 실행

#### Terminal 1: API 서버 시작
```bash
cd backend
npm start
```

**예상 출력:**
```
🚀 TrendFeed Backend running on port 3001
📊 Available sources: reddit, github, arxiv, rss, hackernews
🔗 Health check: http://localhost:3001/api/health
```

#### Terminal 2: 데이터 수집 워커 시작 (새 터미널)
```bash
cd backend
npm run worker
```

**예상 출력:**
```
🚀 Starting TrendFeed Data Ingestion Worker...
🔄 Running initial data ingestion...
🐙 Starting GitHub ingestion...
✅ GitHub: Ingested 30 articles
📚 Starting arXiv ingestion...
✅ arXiv: Ingested 50 articles
🔶 Starting Hacker News ingestion...
✅ Hacker News: Ingested 25 articles
📰 Starting RSS ingestion...
✅ RSS: Ingested 150 articles
🔍 Starting keyword processing...
✅ Keyword processing completed
```

### 프론트엔드 실행

#### 방법 A: 브라우저로 직접 열기
```bash
# 프로젝트 루트에서
start Frontend\index.html
```

또는 `Frontend/index.html` 파일을 더블클릭

#### 방법 B: Live Server 사용 (VSCode)
1. VSCode에서 `Frontend/index.html` 열기
2. 파일 우클릭
3. **"Open with Live Server"** 클릭

---

## 5️⃣ 테스트

### 1. 백엔드 상태 확인
브라우저에서 접속:
```
http://localhost:3001/api/health
```

**예상 응답:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-08T...",
  "sources": ["reddit", "github", "arxiv", "rss", "hackernews"]
}
```

### 2. 데이터 소스 확인
```
http://localhost:3001/api/sources
```

**예상 응답:**
```json
{
  "success": true,
  "sources": {
    "reddit": { "available": false },
    "github": { "available": true },
    "arxiv": { "available": true },
    "rss": { "available": true },
    "hackernews": { "available": true }
  }
}
```

### 3. 트렌드 데이터 확인 (10분 후)
```
http://localhost:3001/api/trends/daily
```

**예상 응답:**
```json
{
  "success": true,
  "date": "2025-10-08",
  "trends": [...],
  "source": "real"
}
```

### 4. 프론트엔드 테스트

1. **회원가입**
   - 아무 이메일/비밀번호 입력
   - "회원가입" 클릭
   - 즉시 대시보드로 이동

2. **대시보드 확인**
   - 상위 10개 AI 트렌드 표시
   - 트렌드 점수, 볼륨, 속도 확인
   - 📊 타임라인 보기 클릭
   - 🔗 Google News 링크 클릭

3. **비밀번호 찾기 테스트**
   - 로그아웃
   - "비밀번호를 잊으셨나요?" 클릭
   - 가입한 이메일 입력
   - 비밀번호 표시 확인

---

## 6️⃣ 데이터 수집 타임라인

### 초기 실행 (처음 10분)
```
0분      → 백엔드 시작
         → 워커 시작
         → 데이터 수집 시작

2-5분    → GitHub: ~30 저장소 수집
         → arXiv: ~50 논문 수집
         → Hacker News: ~25 스토리 수집
         → RSS: ~150 기사 수집

5-10분   → 키워드 추출 (NLP 처리)
         → 트렌드 점수 계산
         → 상위 10개 선정

10분 이후 → 실시간 트렌드 확인 가능!
```

### 자동 업데이트 주기
- **매 1시간**: RSS 피드 (뉴스 기사)
- **매 2시간**: Reddit, Hacker News
- **매 4시간**: GitHub (트렌딩 저장소)
- **매일 오전 6시**: arXiv (학술 논문)
- **매 6시간**: 키워드 처리 및 점수 계산

---

## 7️⃣ 문제 해결

### ❌ "npm: command not found"
**원인**: Node.js가 설치되지 않음  
**해결**: https://nodejs.org/ 에서 Node.js 설치 후 재시도

### ❌ "Port 3001 already in use"
**원인**: 이미 백엔드가 실행 중이거나 다른 프로그램이 포트 사용  
**해결**:
```bash
# 프로세스 종료 후 재시작
netstat -ano | findstr :3001
taskkill /PID <PID번호> /F
```

또는 `backend/config.js`에서 포트 변경:
```javascript
port: process.env.PORT || 3002  // 3001 → 3002
```

### ❌ "Cannot find module"
**원인**: 의존성 패키지 미설치  
**해결**:
```bash
cd backend
npm install
```

### ❌ "Database error" / "Table doesn't exist"
**원인**: Supabase 스키마 미실행  
**해결**: 3️⃣ 데이터베이스 설정 단계 다시 수행

### ❌ 프론트엔드에 데이터가 안 보임
**원인**: 데이터 수집 전 (10분 필요)  
**해결**: 
1. 워커 로그 확인 (`npm run worker`)
2. 10분 대기
3. 대시보드에서 🔄 새로고침 클릭

### ❌ "Supabase access denied"
**원인**: Supabase 프로젝트 접근 권한 없음  
**해결**: 프로젝트 소유자에게 권한 요청

### ❌ Reddit 데이터가 안 보임
**정상입니다!** Reddit API 키가 없으면 Reddit은 건너뜁니다.  
다른 소스(GitHub, arXiv, Hacker News, RSS)만으로도 충분히 작동합니다.

---

## 📊 예상 데이터 수집량

### Reddit 없이 (기본)
- **GitHub**: ~30 저장소
- **arXiv**: ~50 논문
- **Hacker News**: ~25 스토리
- **RSS**: ~150 기사
- **총**: ~255 항목/일

### Reddit 포함 (API 키 설정 시)
- 위 항목 + **Reddit**: ~400 게시물
- **총**: ~655 항목/일

---

## 🎯 빠른 실행 요약

```bash
# 1. 클론 및 설치
git clone <repository-url>
cd Beta_Production
cd backend
npm install

# 2. Supabase에서 SQL 스키마 실행 (한 번만)

# 3. 실행
npm start          # Terminal 1: API 서버
npm run worker     # Terminal 2: 데이터 워커

# 4. 프론트엔드 열기
start ..\Frontend\index.html

# 5. 10분 대기 후 실시간 데이터 확인!
```

---

## 📚 추가 문서

- **전체 소스 목록**: `DATA_SOURCES.md`
- **통합 상세**: `INTEGRATION_SUMMARY.md`
- **빠른 시작**: `QUICK_START.md`
- **백엔드 API**: `backend/README.md`
- **메인 문서**: `README.md`

---

## 🆘 도움이 필요하면?

1. 문서 먼저 확인: `README.md`, `QUICK_START.md`
2. 백엔드 로그 확인: 터미널 출력 메시지
3. 브라우저 콘솔 확인: F12 → Console 탭
4. Issue 생성 또는 팀원에게 문의

---

## ✅ 성공 체크리스트

완료한 항목에 체크하세요:

- [ ] Node.js 설치 완료
- [ ] 레포지토리 클론 완료
- [ ] `npm install` 실행 완료
- [ ] Supabase SQL 스키마 실행 완료
- [ ] 백엔드 API 서버 시작 (http://localhost:3001/api/health 확인)
- [ ] 데이터 워커 시작 (로그에서 "Ingested" 메시지 확인)
- [ ] 10분 대기
- [ ] 프론트엔드 열기
- [ ] 회원가입 완료
- [ ] 대시보드에서 AI 트렌드 확인
- [ ] 실시간 데이터 표시 확인 (🔄 실시간 데이터 배지)

---

**🎉 모든 단계 완료! 이제 TrendFeed로 AI 트렌드를 탐색하세요!**

