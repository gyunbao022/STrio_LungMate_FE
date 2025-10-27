import React, { useState, useEffect } from "react";
import instance from "../../token/interceptors";

const ResetPassword = ({ onNavigate }) => {
  const [token, setToken] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t || "");
    if (!t) setError("유효하지 않은 접근입니다.(토큰 없음)");
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!token) return setError("토큰이 없습니다.");
    if (!pwd || pwd.length < 4) return setError("비밀번호는 4자 이상이어야 합니다.");
    if (pwd !== pwd2) return setError("비밀번호가 일치하지 않습니다.");

    try {
      const res = await instance.post("/member/resetPasswd", { token, newPassword: pwd });
      setOk(res.data.message || "비밀번호가 변경되었습니다. 로그인 해주세요.");
      setTimeout(() => onNavigate("login"), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || "처리 중 오류가 발생했습니다.";
      setError(msg);
    }
  };

  const input = "w-full p-2 bg-gray-700 rounded mt-1 border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50";

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border border-gray-700 rounded">
      <h2 className="text-xl font-bold mb-4">비밀번호 재설정</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="password" placeholder="새 비밀번호" className={input}
               value={pwd} onChange={e => setPwd(e.target.value)} />
        <input type="password" placeholder="새 비밀번호 확인" className={input}
               value={pwd2} onChange={e => setPwd2(e.target.value)} />
        <button type="submit" className="w-full bg-blue-600 py-2 rounded hover:bg-blue-700 font-bold">
          변경하기
        </button>
      </form>
      {error && <p className="text-red-400 text-center text-sm pt-2">{error}</p>}
      {ok && <p className="text-green-400 text-center text-sm pt-2">{ok}</p>}
    </div>
  );
};

export default ResetPassword;
