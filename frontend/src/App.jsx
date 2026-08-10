import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/register";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import History from "./pages/History";
import NotFound from "./pages/NotFound";

import InitialAssessment from "./components/InitialAssessment";
import FollowUpQuestionnaire from "./components/FollowUpQuestionnaire";
import Recommendations from "./components/Recommendations";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Authentication */}
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Initial Assessment */}
        <Route
          path="/initial-assessment"
          element={<InitialAssessment />}
        />

        {/* Main application */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/history"
          element={<History />}
        />

        {/* Follow-up questionnaire */}
        <Route
          path="/follow-up"
          element={<FollowUpQuestionnaire />}
        />

        {/* Recommendations */}
        <Route
          path="/recommendations"
          element={<Recommendations />}
        />

        {/* Optional Dashboard routes */}
        <Route
          path="/progress"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="/insights"
          element={<Navigate to="/recommendations" replace />}
        />

        <Route
          path="/plan"
          element={<Navigate to="/recommendations" replace />}
        />

        {/* 404 */}
        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;