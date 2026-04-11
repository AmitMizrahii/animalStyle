import React from "react";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./hooks/useAuth";
import "./App.css";

const App: React.FC = () => {
  const { isInitializing } = useAuth();

  return (
    <Router>
      <div className="app-shell">
        <main className="main-content">
          {isInitializing ? (
            <div className="loading-container">
              <div className="spinner">Loading...</div>
            </div>
          ) : (
            <Routes>
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          )}
        </main>
      </div>
    </Router>
  );
};

export default App;
