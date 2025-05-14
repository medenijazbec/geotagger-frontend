// src/App.tsx
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

// only the pages you actually want to use:
import LandingPage from './components/landingPage/landingPage';
import SigninPage  from './components/singInPage/signInPage';
import SingupPage  from './components/signUpPage/singUpPage';
import HomePage from './components/homePage/homePage';
import ProfilePage       from './components/profilePage/profilePage';

// auth guard
import RequireAuth from './components/RequireAuth';

export function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/"                   element={<LandingPage />} />
        <Route path="/signin"             element={<SigninPage />} />
        <Route path="/signup"             element={<SingupPage />} />
     
      {/* Authenticated “home” */}
             <Route
              path="/home"
              element={
                <RequireAuth>
                  <HomePage />
                </RequireAuth>
              }
            />
        {/* Protected */}
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        {/* everything else → landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
