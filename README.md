
# Next.js Tetris with Google Sheets

현대적인 디자인의 테트리스 게임입니다. Next.js 14 (App Router), TypeScript, Tailwind CSS를 사용하여 제작되었습니다.

## 주요 기능
- 10x20 게임 보드 및 블록 미리보기/그림자 기능
- 3줄 제거 시 게임 클리어 (Win)
- 실시간 타이머 및 점수 시스템
- Google Sheets API 연동 (상위 3명 랭킹 표시)
- 세련된 다크 모드 및 글래스모피즘 디자인

## 설치 및 실행 방법

1. 의존성 설치:
   ```bash
   npm install
   ```

2. 환경 변수 설정:
   `.env.local.example` 파일을 복사하여 `.env.local` 파일을 만들고 다음 정보를 입력하세요:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`: 서비스 계정 이메일
   - `GOOGLE_PRIVATE_KEY`: 서비스 계정의 JSON 키 파일에 있는 `private_key` 값 (따옴표로 감싸고 `\n` 포함)
   - `GOOGLE_SHEET_ID`: 연동할 구글 시트의 ID

3. 개발 서버 실행:
   ```bash
   npm run dev
   ```

## 구글 시트 설정 가이드

1. **Google Cloud Console**:
   - 프로젝트를 생성하고 **Google Sheets API**를 활성화합니다.
   - **서비스 계정**을 생성하고 JSON 키를 다운로드합니다.
2. **구글 시트 생성**:
   - 새 시트를 만들고 첫 번째 시트 이름을 `Sheet1`으로 설정합니다.
   - 서비스 계정 이메일을 시트에 **편집자(Editor)** 권한으로 초대합니다.
3. **데이터 구조**:
   - 게임은 자동으로 `이름`, `완료 시간(초)`, `점수`, `날짜/시간` 순으로 데이터를 저장합니다.

## 조작 방법
- **← / →**: 이동
- **↑**: 회전
- **↓**: 소프트 드롭
- **Space**: 하드 드롭 (즉시 낙하)
- **P**: 일시정지
