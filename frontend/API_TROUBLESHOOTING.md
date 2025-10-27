# Notice.js 권한 오류 해결 가이드

## 🔍 발견된 문제들

### 1. 하드코딩된 관리자 권한 (해결됨)
```javascript
// ❌ 이전 코드 (38번 줄)
const isAdmin = true;

// ✅ 수정된 코드
const isAdmin = currentUser && currentUser.role === 'A';
```

### 2. 잘못된 사용자 ID 전송 (해결됨)
```javascript
// ❌ 이전 코드
const userId = currentUser ? currentUser.memberName : null;
formData.append('memberName', userId);

// ✅ 수정된 코드
if (!currentUser || !currentUser.memberId) {
    alert("로그인 정보가 없어 저장할 수 없습니다. 다시 로그인해주세요.");
    return;
}
formData.append('memberId', currentUser.memberId);
```

### 3. 개선된 에러 처리
- 상세한 콘솔 로그 추가
- HTTP 상태 코드별 명확한 에러 메시지
- 디버깅을 위한 로깅 추가

## 🧪 테스트 방법

### 1. 브라우저 개발자 도구 열기 (F12)
Console 탭에서 다음 정보 확인:

```javascript
=== 공지사항 저장 시작 ===
currentUser: {memberId: "...", memberName: "...", role: "A", ...}
localStorage userId: "..."
localStorage memberName: "..."
localStorage roleCd: "A"
localStorage Authorization: "Bearer eyJ..."
```

### 2. 권한 오류 발생 시 체크리스트

#### ✅ 로그인 상태 확인
```javascript
// 콘솔에서 실행
console.log("현재 사용자:", localStorage.getItem("userId"));
console.log("토큰:", localStorage.getItem("Authorization"));
console.log("역할:", localStorage.getItem("roleCd"));
```

#### ✅ 관리자 권한 확인
- `roleCd`가 `'A'`인지 확인
- 현재 코드는 관리자만 글쓰기 버튼이 표시됨

#### ✅ 네트워크 요청 확인
Network 탭에서:
1. `/notice/write` 또는 `/notice/update` 요청 찾기
2. Headers 탭 확인:
   - `Authorization: Bearer ...` 헤더 존재 여부
   - `Content-Type: multipart/form-data` 확인
3. Payload 탭 확인:
   - `title`: 제목
   - `cont`: 내용
   - `memberId`: 작성자 ID
   - `noticeId`: (수정 시만) 공지사항 ID

## 🔧 백엔드 API 스펙 확인 필요

현재 코드가 전송하는 데이터:
```javascript
FormData {
  title: "공지사항 제목",
  cont: "공지사항 내용",
  memberId: "user123",        // 새 글 작성/수정 시
  noticeId: "123"             // 수정 시만
}
```

### 백엔드에서 확인할 사항:
1. **필드명이 맞는지?**
   - `memberId` vs `userId` vs `memberName` vs `writerId`
   - 백엔드 DTO에서 어떤 필드명을 사용하는지 확인

2. **권한 검증 로직**
   - JWT 토큰의 role 체크
   - 403 Forbidden이 발생하는 조건

3. **필수 필드**
   - NOT NULL 제약조건이 있는 컬럼
   - 백엔드에서 필수로 요구하는 필드

## 🚨 예상 오류 코드별 해결 방법

### 400 Bad Request
- **원인**: 필수 필드 누락 또는 잘못된 형식
- **해결**: 백엔드 로그에서 정확한 필드명 확인

### 401 Unauthorized
- **원인**: 토큰 만료 또는 없음
- **해결**: 다시 로그인

### 403 Forbidden
- **원인**: 권한 부족 (role이 'A'가 아님)
- **해결**: 관리자 계정으로 로그인

### 500 Internal Server Error
- **원인**: 백엔드 서버 오류
- **해결**: 백엔드 콘솔 로그 확인

## 📝 백엔드 담당자에게 전달할 정보

다음 정보를 백엔드 개발자에게 문의하세요:

```
공지사항 작성/수정 API 스펙 확인 요청

1. POST /notice/write 
   - 필요한 필드명: memberId? userId? writerId?
   - 필수 필드는 무엇인가요?
   - 권한 검증 로직: role === 'A'만 가능한가요?

2. PUT /notice/update
   - 필요한 필드명: 동일한가요?
   - noticeId는 어디에 포함되나요? (body? path parameter?)

3. 최근 403 Forbidden 오류 로그
   - 어떤 검증에서 실패했나요?
   - 필요한 헤더나 필드가 누락되었나요?
```

## 💡 추가 개선 사항

### 1. 환경변수로 API URL 관리
```javascript
// .env 파일
REACT_APP_API_URL=http://localhost:8090

// interceptors.js
baseURL: process.env.REACT_APP_API_URL
```

### 2. 에러 경계(Error Boundary) 추가
컴포넌트 레벨에서 에러를 잡아 사용자 친화적인 UI 표시

### 3. 권한 검증 미들웨어
관리자 전용 페이지는 라우트 레벨에서 권한 체크

## 🎯 현재 상태

✅ **해결됨**:
- 하드코딩된 관리자 권한 제거
- memberId를 올바르게 전송
- 상세한 에러 로깅 추가
- Content-Type 헤더 명시

⚠️ **확인 필요**:
- 백엔드 API가 기대하는 정확한 필드명
- 백엔드의 권한 검증 로직
- JWT 토큰 유효성

🔄 **다음 단계**:
1. 개발자 도구 Console에서 로그 확인
2. Network 탭에서 실제 요청/응답 확인
3. 백엔드 로그 확인
4. 필요시 백엔드 API 스펙 조정
