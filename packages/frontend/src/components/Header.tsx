import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./Header.css";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header-container">
        <div
          className="header-logo"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <h1>🐾 AnimalStyle</h1>
        </div>

        <nav className="header-nav">
          <button
            className={`nav-link${location.pathname === "/" ? " active" : ""}`}
            onClick={() => {
              navigate("/");
              setShowMenu(false);
            }}
          >
            Feed
          </button>
          <button
            className={`nav-link${location.pathname === "/create" ? " active" : ""}`}
            onClick={() => {
              navigate("/create");
              setShowMenu(false);
            }}
          >
            Create Post
          </button>
        </nav>

        <div className="header-user">
          <button
            className="user-menu-toggle"
            onClick={() => setShowMenu(!showMenu)}
          >
            {user?.username || "User"} ▼
          </button>

          {showMenu && (
            <div className="user-menu">
              <button
                className="user-menu-item"
                onClick={() => {
                  navigate(`/profile/${user?._id}`);
                  setShowMenu(false);
                }}
              >
                My Profile
              </button>
              <button className="user-menu-item logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);
