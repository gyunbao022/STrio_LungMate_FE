# Frontend 구조 가이드

이 문서는 `src/` 폴더를 깔끔하게 유지하기 위한 표준 구조와 네이밍/경로 규칙을 정의합니다.

## 폴더 구조

```
src/
  app/                # 앱 전역 Provider, 전역 설정, 부트스트랩
    providers.js      # AuthProvider 등 전역 Provider 재노출

  assets/             # 이미지/폰트/정적 리소스
  styles/             # 전역 CSS, Tailwind 설정 확장 (필요 시)
  components/         # 재사용 가능한 UI 컴포넌트(순수 presentational)
  features/           # 도메인별 기능 묶음(상태+UI+서비스 포함 가능)
    auth/
    diagnosis/
  pages/              # 페이지(= 라우트) 단위 컨테이너(현재는 상태 기반 전환)
  hooks/              # 커스텀 훅
  contexts/           # Context 정의(Provider는 app/에서 감싸기 권장)
  services/           # 외부 API, axios 클라이언트, 캐시, 스토리지
    api/
      client.js       # 공용 axios 클라이언트 진입점
  utils/              # 순수 유틸 함수
  constants/          # 상수/열거형
  types/              # TS 타입 또는 JSDoc 타입(선택)
```

## 경로 별칭(alias)
CRA에서 `jsconfig.json`으로 절대 경로 import를 지원합니다.

예)
```js
import api from '@api/client';
import { AuthProvider } from '@app/providers';
import Navbar from '@components/Navbar';
```

`frontend/jsconfig.json`에 설정되어 있으며, 기존 상대경로는 그대로 동작합니다. 점진적으로 변경하세요.

## 네이밍 규칙
- 컴포넌트: PascalCase (`Navbar.jsx`, `ResultCard.jsx`)
- 훅: `use` 접두사 (`useAuth.js`)
- 파일 확장자: `.jsx`(JSX 포함 컴포넌트), `.js`(로직/유틸)
- Barrel 파일: `index.js`로 하위 export 정리 (필요 시)

## 마이그레이션 체크리스트
- [ ] axios 직접 import → `@api/client` 사용
- [ ] 전역 Provider import 경로 → `@app/providers` 사용
- [ ] 도메인별 폴더로 컴포넌트/페이지 이동 (예: `components/diagnosis/*` → `features/diagnosis/`)
- [ ] 중복 파일 정리 (`Login.js` vs `Login.jsx` 등)
- [ ] `pages/`와 `features/` 역할 구분 (라우팅 도입 시 `pages/`는 라우트 엔트리)

## 단계적 정리 전략
1) 비파괴적: alias 도입, 디렉터리 생성, 재노출 파일(`providers.js`, `api/client.js`) 추가
2) 저위험 리팩터: 일부 import를 alias로 교체, Barrel 도입
3) 기능 단위 이동: `diagnosis`, `auth` 등 묶음 이동 후 import 경로 일괄 수정
4) 중복/미사용 파일 제거 및 테스트/빌드 확인

## 참고
- 현재 라우팅은 상태 기반 전환(`App.js`)을 사용합니다. `react-router` 도입 시 `pages/` 중심 구조로 확장하는 것을 권장합니다.
