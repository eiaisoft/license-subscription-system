# License Subscription System

라이선스 구독 관리 시스템 - 기관별 라이선스 구독을 효율적으로 관리하는 웹 애플리케이션

## 🚀 기능

### 관리자 기능
- 기관 관리 (생성, 수정, 삭제, 조회)
- 사용자 관리 (승인, 비활성화, 역할 변경)
- 라이선스 관리 (등록, 수정, 삭제)
- 구독 관리 (승인, 거부, 연장, 취소)
- 대시보드 (통계 및 현황 조회)

### 사용자 기능
- 회원가입 및 로그인
- 소속 기관의 구독 라이선스 조회
- 신청 가능한 라이선스 목록 조회
- 라이선스 구독 신청
- 개인 프로필 관리

## 🛠️ 기술 스택

- **Frontend**: React.js, CSS3, JavaScript
- **Backend**: Node.js, Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT, Supabase Auth
- **Deployment**: Vercel
- **Version Control**: Git, GitHub

## 📋 요구사항

- Node.js 18.x 이상
- npm 또는 yarn
- Supabase 계정
- Vercel 계정 (배포용)

## 🔧 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd license-subscription-system
```

### 2. 의존성 설치
```bash
npm run install:all
```

### 3. 환경변수 설정
```bash
cp .env.example .env
# .env 파일을 열어 실제 값으로 수정
```

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 브라우저에서 확인