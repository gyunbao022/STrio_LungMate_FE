import { useEffect, useRef } from "react";
import instance from "services/api/client";

const Logout = ({ onNavigate, onLogout }) => {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleLogout = async () => {
      console.log("logout start");
      const userId = localStorage.getItem("userId");
      console.log("logout userId =>", userId);

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("Authorization"),
          "Authorization-refresh": localStorage.getItem("Authorization-refresh"),
        },
      };

      try {
        await instance.delete(`/member/logout`, config);
      } catch (error) {
        console.warn("logout 실패 =>", error.message);
      }

      localStorage.clear();
      onLogout();
      onNavigate("main");

      console.log("logout 완료, 메인 페이지 이동");
    };

    handleLogout();
  }, [onNavigate, onLogout]);

  return null;
};

export default Logout;
