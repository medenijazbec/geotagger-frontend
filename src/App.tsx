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

export function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/"       element={<LandingPage />} />
        <Route path="/signin" element={<SigninPage />}  />
        <Route path="/signup" element={<SingupPage />}  />

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
        element={<GuessLocationPage />} />
        
        <Route
          path="/edit-location/:id"
          element={
            <RequireAuth>
              <EditLocationPage />
            </RequireAuth>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
