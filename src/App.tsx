// src/App.tsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import LandingPage     from './components/landingPage/landingPage';
import SigninPage      from './components/singInPage/signInPage';
import SingupPage      from './components/signUpPage/singUpPage';
import HomePage        from './components/homePage/homePage';
import ProfilePage     from './components/profilePage/profilePage';
import AddLocationPage from './components/addLocationPage/AddLocationPage';
import EditLocationPage from './components/editLocationPage/EditLocationPage';
import GuessLocationPage from './components/guessLocationPage/LocationGuessPage';
import RequireAuth from './components/RequireAuth';
import ConfirmEmailPage   from "./components/emailConfirmationPage/confirmEmailPage";
import ResetPasswordPage  from "./components/resetPasswordPage/resetPasswordPage";
import AdminLayout from './components/admin/AdminLayout';
import UsersPage from './components/admin/UsersPage';
import UserDetailPage from './components/admin/UserDetailPage';
import LocationDetailPage from './components/admin/LocationDetailPage';
import LocationsPage from './components/admin/LocationsPage';
import ActivityLogPage from './components/admin/ActivityLogPage';
import RequireAdmin from './components/RequireAdmin';



export function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/"       element={<LandingPage />} />
        <Route path="/signin" element={<SigninPage />}  />
        <Route path="/signup" element={<SingupPage />}  />
        <Route path="/confirm-email"   element={<ConfirmEmailPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />

        {/* Private / Protected */}
        <Route
          path="/home"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/add-location"
          element={
            <RequireAuth>
              <AddLocationPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        <Route 
        path="/guess-location/:id" 
        element={<RequireAuth><GuessLocationPage /></RequireAuth>} />
        
        <Route
          path="/edit-location/:id"
          element={
            <RequireAuth>
              <EditLocationPage />
            </RequireAuth>
          }
        />
 <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="locations/:id" element={<LocationDetailPage />} />
          <Route path="activity-log" element={<ActivityLogPage />} />
        </Route>

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
