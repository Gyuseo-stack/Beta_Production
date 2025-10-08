## 🎯 프로젝트 개요

**TrendFeed**는 23개의 무료 데이터 소스에서 실시간으로 AI 트렌드를 수집하고 분석하여 매일 상위 10개 키워드를 제공하는 AI 트렌드 대시보드입니다.

### 주요 특징
- ✅ **23개 무료 데이터 소스** 통합 (Reddit 16개, RSS 15개, GitHub, arXiv, Hacker News 등)
- ✅ **실시간 트렌드 분석** - 매일 상위 10개 AI 키워드 자동 생성
- ✅ **지능형 스코어링** - 볼륨, 속도, 권위도, 다양성 기반 트렌드 점수
- ✅ **간단한 인터페이스** - 로그인 후 바로 트렌드 확인

## ⚡ 빠른 시작 (Quick Start)

### 새로운 팀원을 위한 완전한 설정 가이드
👉 **[SETUP_GUIDE_KR.md](SETUP_GUIDE_KR.md)** - 상세한 한국어 설정 가이드

### 30초 요약
```bash
# 1. 백엔드 설치 및 실행
cd backend
npm install
npm start          # Terminal 1

# 2. 데이터 수집 시작
npm run worker     # Terminal 2

# 3. Supabase에서 SQL 스키마 실행 (한 번만)
# backend/database/schema.sql 내용을 복사하여
# https://supabase.com/dashboard 에서 실행

# 4. 프론트엔드 열기
start Frontend/index.html

# 5. 10분 대기 후 실시간 데이터 확인!
```

## 실행 방법

### 프론트엔드 (Frontend)

#### 방법 1: Live Server (VSCode 추천)
1. VSCode 설치
2. Extensions에서 "Live Server" 검색 후 설치
3. `Frontend/index.html` 파일 우클릭
4. "Open with Live Server" 클릭

#### 방법 2: 브라우저로 바로 열기
1. `Frontend/index.html` 파일을 더블클릭
2. 브라우저에서 열림
(⚠️ 주의: 백엔드 없이는 데모 데이터만 표시됨)

#### 방법 3: Python 서버
```bash
cd Frontend
python -m http.server 8000
```

## 🚀 AI Zeitgeist Engine Integration (Phase 2)

**실시간 AI 트렌드 분석 시스템이 추가되었습니다!**

### 새로운 기능
- **실시간 데이터 수집**: Reddit, GitHub, arXiv, RSS 피드에서 실시간 데이터 수집
- **고급 키워드 분석**: NLP 기반 키워드 추출 및 정규화
- **지능형 트렌드 스코어링**: 볼륨, 속도, 권위, 다양성, 감정 분석을 통한 종합 점수
- **다중 소스 통합**: 4개 무료 소스에서 동시 데이터 수집

### 백엔드 시작하기

1. **백엔드 설치**
```bash
cd backend
npm install
```

2. **환경 설정**
```bash
# .env 파일 생성 (선택사항)
cp .env.example .env
# Reddit API 키 설정 (선택사항)
```

3. **데이터베이스 설정**
```bash
npm run setup
```

4. **서버 시작**
```bash
# Windows
start-backend.bat

# 또는 수동으로
npm start          # API 서버
npm run worker     # 데이터 수집 워커
```

### 🟢 통합된 무료 데이터 소스 (Integrated Free Sources)

#### 학술 & 연구
- **arXiv API**: cs.AI, cs.LG, cs.CL, stat.ML 카테고리 (권위도: 9/10)
- **Papers with Code**: ML 논문 + 구현 코드 (권위도: 9/10) - 통합 예정

#### 코드 & 개발자 플랫폼
- **GitHub Trending**: AI/ML 트렌딩 저장소 (권위도: 8/10)
- **Hugging Face**: 트렌딩 모델, 데이터셋, Spaces (권위도: 9/10)
- **Kaggle API**: 경쟁, 데이터셋, 노트북 (권위도: 7/10) - 통합 예정

#### 소셜 미디어 & 커뮤니티
- **Reddit API** (권위도: 7/10):
  - r/MachineLearning (2.8M 멤버)
  - r/artificial (200K 멤버)
  - r/LocalLLaMA (150K 멤버)
  - r/StableDiffusion (300K 멤버)
  - r/learnmachinelearning (500K 멤버)
  - r/deeplearning (150K 멤버)
  - r/singularity (200K 멤버)
- **Hacker News API**: YCombinator 기술 토론 (권위도: 8/10) - 통합 예정
- **Stack Overflow API**: AI/ML 질문 (권위도: 7/10) - 통합 예정

#### 뉴스 & 미디어 (RSS 피드)
- **TechCrunch AI** (권위도: 7/10)
- **The Verge AI** (권위도: 7/10)
- **Towards Data Science** (권위도: 6/10)
- **MIT Technology Review AI** (권위도: 8/10) - 통합 예정
- **VentureBeat AI** (권위도: 7/10) - 통합 예정
- **Wired AI** (권위도: 7/10) - 통합 예정
- **KDnuggets** (권위도: 6/10) - 통합 예정

#### AI 기업 블로그 (웹 스크래핑)
- **NVIDIA AI Blog** (권위도: 9/10) - 통합 예정
- **Microsoft AI Blog** (권위도: 9/10) - 통합 예정
- **AWS ML Blog** (권위도: 9/10) - 통합 예정

### 🔴 계획된 유료 소스 (Planned Paid Sources)

#### 소셜 미디어
- **X (Twitter) API**: $100/월 - 10,000 트윗/월, 검색 API
  - 주요 계정: @ylecun, @karpathy, @sama, @demishassabis 등
- **Threads API**: 가격 미정 (2024년 공개 예정)

#### 뉴스 & 미디어
- **NewsAPI**: $449/월 - 80,000+ 뉴스 소스
- **Bloomberg Terminal API**: $24,000/년 - 실시간 금융/기술 뉴스
- **Reuters API**: 커스텀 가격 - 글로벌 뉴스

#### AI 기업 블로그 (웹 스크래핑 - 무료지만 복잡)
- **OpenAI Blog** (권위도: 10/10)
- **Google DeepMind Blog** (권위도: 10/10)
- **Meta AI Blog** (권위도: 10/10)
- **Anthropic News** (권위도: 9/10)
- **Stability AI Blog** (권위도: 8/10)
- **RunwayML Blog** (권위도: 7/10)
- **Mistral AI Blog** (권위도: 8/10)

#### Discord 커뮤니티 (봇 필요 - 무료지만 설정 필요)
- **Midjourney Discord** (16M+ 멤버)
- **Stability AI Discord** (200K+ 멤버)
- **OpenAI Discord** (500K+ 멤버)
- **Hugging Face Discord** (50K+ 멤버)
- **LangChain Discord** (30K+ 멤버)

**📊 총 70+ 데이터 소스 확인됨**
- **현재 통합: 23개** (Reddit 16개 서브레딧 + GitHub + arXiv + Hugging Face + RSS 12개 + Hacker News)
- 무료 통합 가능: 40+ 개
- 유료/계획: 13개

### 🎯 최신 통합 현황 (Phase 2 완료)
- ✅ **16개 Reddit 커뮤니티** (총 7.5M+ 멤버)
- ✅ **15개 RSS 피드** (주요 AI 기업 블로그 포함)
- ✅ **Hacker News** (YCombinator 기술 토론)
- ✅ **GitHub Trending** (AI/ML 저장소)
- ✅ **arXiv** (학술 논문 4개 카테고리)
- ✅ **Hugging Face** (모델, 데이터셋, Spaces)

자세한 소스 목록은 `DATA_SOURCES.md` 참조

### API 엔드포인트
- `GET /api/health` - 서버 상태 확인
- `GET /api/trends/daily` - 일일 트렌드 조회
- `GET /api/trends/daily/:domain` - 도메인별 트렌드
- `GET /api/sources` - 데이터 소스 상태

### 트렌드 스코어링 알고리즘
```javascript
TrendScore = (Volume × 0.3) + (Authority × 0.4) + (Diversity × 0.3)
```

- **Volume**: 언급 횟수
- **Authority**: 소스 권위도 (arXiv=9, GitHub=8, Reddit=7)
- **Diversity**: 소스 다양성 (여러 플랫폼에서 언급)
- **Velocity**: 성장 속도
- **Sentiment**: 감정 분석 점수
