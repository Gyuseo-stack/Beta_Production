## 실행 방법
#### 방법 1: Live Server (VSCode 추천)

1. VSCode 설치
2. Extensions에서 "Live Server" 검색 후 설치
3. index.html 파일 우클릭
4. "Open with Live Server" 클릭

#### 방법 2: 브라우저로 바로 열기

1. index.html 파일을 더블클릭
2. 브라우저에서 열림
(⚠️ 주의: 일부 기능이 작동하지 않을 수 있음)

#### 방법 3: Python 서버
python -m http.server 8000

## 다음 단계 (Phase 2)
**현재는 Mock 데이터를 사용하고 있음**
1. NewsAPI 연동

EX)
```
const NEWS_API_KEY = 'your-api-key'

async function fetchNews(domain) {
  const response = await fetch(
    `https://newsapi.org/v2/everything?q=${domain}&apiKey=${NEWS_API_KEY}`
  )
  const data = await response.json()
  return data.articles
}
```
2. 키워드 추출

EX)
```
function extractKeywords(articles) {
  const words = {}
  articles.forEach(article => {
    const text = article.title + ' ' + article.description
    text.split(' ').forEach(word => {
      words[word] = (words[word] || 0) + 1
    })
  })
  
  // 빈도수 상위 10개 추출
  return Object.entries(words)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
}
```
