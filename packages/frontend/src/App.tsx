import React from "react";
import { Route, Routes, BrowserRouter as Router } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./hooks/useAuth";

const App: React.FC = () => {
  // const { isAuthenticated, isLoading } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </Router>
  );
};

export default App;
