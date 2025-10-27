import axios from "axios";

// 디버깅용: JWT Payload 디코드 (개발 중 확인 목적)
const decodeJwt = (bearerToken) => {
    try {
        if (!bearerToken) return null;
        const token = bearerToken.replace(/^Bearer\s+/i, "");
        const payload = token.split(".")[1];
        return JSON.parse(atob(payload));
    } catch (e) {
        return null;
    }
};

/**
* ✅ AccessToken 재발급 함수
* RefreshToken을 이용해 새로운 AccessToken을 발급받습니다.
*/
const refreshAccessToken = async () => {
try {
    const refreshToken = localStorage.getItem("Authorization-refresh");
    if (!refreshToken) throw new Error("refreshToken 없음");

    const response = await axios.post(
    "/auth/refresh",
    {},
    {
        baseURL: "http://localhost:8090",
        headers: {
        "Authorization-refresh": refreshToken,
        },
        // JWT 헤더 기반 인증만 사용하므로 쿠키 전송 비활성화
        withCredentials: false,
    }
    );

    // 디버깅: 새 토큰 페이로드 출력
    const newAccessToken = response.data.accessToken;
    const payload = decodeJwt(`Bearer ${newAccessToken}`);
    console.log("[auth] refreshed access token payload:", payload);

    return newAccessToken;
} catch (error) {
    console.error("❌ refreshToken 갱신 실패:", error);
    throw error;
}
};

/**
* ✅ Axios 공통 인스턴스
*/
const instance = axios.create({
baseURL: "http://localhost:8090",
// JWT 헤더 기반 인증을 사용하므로 쿠키 전송을 비활성화하여 CSRF 403 가능성 제거
withCredentials: false,
});

/**
* ✅ 요청 인터셉터
* 모든 요청에 AccessToken 자동 포함
*/
instance.interceptors.request.use(
(config) => {
    const token = localStorage.getItem("Authorization");
    if (token) {
    config.headers["Authorization"] = token; // ex) "Bearer eyJ..."
    
        // 디버깅: 요청 시 토큰 페이로드 확인
        const payload = decodeJwt(token);
        if (payload) {
            console.log("[auth] request jwt payload:", payload);
        }
    }
    return config;
},
(error) => Promise.reject(error)
);

/**
* ✅ 응답 인터셉터
* 401(Unauthorized) 발생 시 AccessToken 재발급 처리
*/
instance.interceptors.response.use(
(response) => response,
async (error) => {
    const originalRequest = error.config;

    /**
    * 1️⃣ 로그인/회원가입/아이디찾기 등 비인증 요청은 예외처리
    * -> 세션 만료 메시지 표시 X
    */
    const unauthenticatedEndpoints = ["/login", "/signup", "/find-account"];
    if (unauthenticatedEndpoints.some((url) => originalRequest.url.includes(url))) {
    return Promise.reject(error); // 그대로 Login.jsx 등으로 전달
    }

    /**
    * 2️⃣ AccessToken 만료로 인한 401 에러 처리
    */
    if (
    error.response &&
    error.response.status === 401 &&
    !originalRequest._retry
    ) {
    originalRequest._retry = true;

    try {
        // AccessToken 재발급
        const newAccessToken = await refreshAccessToken();
        const bearerToken = `Bearer ${newAccessToken}`;

        // 새 토큰 저장
        localStorage.setItem("Authorization", bearerToken);

        // 요청 헤더 갱신
        originalRequest.headers["Authorization"] = bearerToken;
        if (
        originalRequest.data instanceof FormData &&
        !originalRequest.headers["Content-Type"]
        ) {
        originalRequest.headers["Content-Type"] = "multipart/form-data";
        }

        // ✅ 재요청 실행 (403 발생 시 권한 부족 가능성 높음)
        return instance(originalRequest);
    } catch (refreshError) {
        console.error("❌ refreshToken 재발급 실패:", refreshError);

        try {
            localStorage.removeItem("Authorization");
            localStorage.removeItem("Authorization-refresh");
            localStorage.removeItem("userId");
            localStorage.removeItem("memberName");
            localStorage.removeItem("roleCd");
            localStorage.removeItem("email");
            localStorage.removeItem("isLogin");
        } catch {}

        // 사용자에게 안내 후 로그인 페이지로 이동
        if (typeof window !== 'undefined') {
            setTimeout(() => {
                alert('세션이 만료되었습니다. 다시 로그인해주세요.');
                // SPA 상태 초기화를 위해 전체 리로드
                window.location.href = '/';
            }, 0);
        }

        return Promise.reject(refreshError);
    }
    }

        // 403인 경우: 인증은 되었으나 권한 부족(AccessDenied) 가능성이 높음
        if (error.response && error.response.status === 403) {
            // 디버깅을 위해 현재 보유한 토큰 페이로드를 함께 출력
            const token = localStorage.getItem("Authorization");
            const payload = decodeJwt(token);
            console.warn("[auth] 403 Forbidden: 권한 부족 또는 서버 인가 규칙 미스매치 가능성", { authorities: payload?.authorities, sub: payload?.sub, roleCd: payload?.roleCd });
        }

        return Promise.reject(error);
}
);

export default instance;