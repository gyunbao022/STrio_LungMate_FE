// src/components/layout/BaseLayout.jsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import "../../App.css";

const clubs = [
  { name: "Tottenham Hotspur", path: "tottenham_hotspur", clubNo: "4" },
  { name: "Chelsea", path: "chelsea", clubNo: "3" },
  { name: "Liverpool", path: "liverpool", clubNo: "1" },
  { name: "Manchester City", path: "manchester_city", clubNo: "2" },
];

const BaseLayout = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {/* 고정 메뉴바 */}
      <div className="menu-bar">
        <div className="logo-wrap">
          <NavLink to="/league">
            <img src="/images/logo.png" alt="Logo" className="logo-img" />
          </NavLink>
        </div>

        <div className="nav-links">
          <NavLink to="/league">리그테이블</NavLink>
          <NavLink to="/club">구단정보</NavLink>

          {/* 선수정보 드롭다운 */}
          <div
            className="dropdown"
            onMouseEnter={() => {
              console.log("mouseenter");
              setShowDropdown(true);
            }}
            onMouseLeave={() => {
              console.log("mouseleave");
              setShowDropdown(false);
            }}
          >
            <span className="dropdown-toggle">선수정보</span>
            {showDropdown && (
              <ul className="dropdown-menu">
                {clubs.map((club) => (
                  <li
                    key={club.path}
                    className="dropdown-item"
                    onClick={() => navigate(`/players/${club.clubNo}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        navigate(`/players/${club.clubNo}`);
                    }}
                    tabIndex={0}
                  >
                    {club.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 로그인 링크는 드롭다운 바깥 */}
          {localStorage.getItem("adminId") == null ? (
            <NavLink to="/login">로그인</NavLink>
          ) : (
            <NavLink to="/logout">로그아웃</NavLink>
          )}
        </div>
      </div>

      {/* 본문 영역 */}
      <div className="content-wrapper">
        <Outlet />
      </div>
    </>
  );
};

export default BaseLayout;
