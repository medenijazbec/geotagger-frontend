// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import ProfilePage from "./components/ProfilePage";
import AuctionsPage from "./components/AuctionsPage";
import AuctionDetailPage from "./components/AuctionDetailPage";

// Admin / Control Panel
import ControlPanelPage from "./components/admin/ControlPanelPage";
import UsersPage from "./components/admin/UsersPage";
import UserDetailPage from "./components/admin/UserDetailPage";
import AdminAuctionsPage from "./components/admin/AdminAuctionsPage";
import AdminAuctionDetailPage from "./components/admin/AdminAuctionDetailPage";

import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";

import "./App.css";


export function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="landing" element={<LandingPage />} />

        {/* Protected */}
        <Route
          path="profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        {/* Public auctions listing + detail */}
        <Route
          path="auctions"
          element={
            <RequireAuth>
              <AuctionsPage />
            </RequireAuth>
          }
        >
          <Route
            path=":id"
            element={
              <RequireAuth>
                <AuctionDetailPage />
              </RequireAuth>
            }
          />
        </Route>

        {/* Admin-only control panel */}
        <Route
          path="admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <ControlPanelPage />
              </RequireAdmin>
            </RequireAuth>
          }
        >
          {/* default to users */}
          <Route index element={<Navigate to="users" replace />} />

          {/* /admin/users */}
          <Route path="users" element={<UsersPage />} />

          {/* /admin/users/:id */}
          <Route path="users/:id" element={<UserDetailPage />} />

          {/* /admin/auctions */}
          <Route path="auctions" element={<AdminAuctionsPage />} />

          {/* /admin/auctions/:id */}
          <Route path="auctions/:id" element={<AdminAuctionDetailPage />} />
        </Route>

        {/* catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
