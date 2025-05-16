import React from 'react';
import facebookIcon from '../../assets/facebook-icon.png';
import { API_BASE } from '../config';

interface Props {
  redirectPath?: string; // Default after login, e.g. "/home"
  children?: React.ReactNode;
}

const SignInWithFacebookButton: React.FC<Props> = ({ redirectPath = "/home", children }) => {
  const handleFacebookLogin = () => {
    // After Facebook auth, the backend will redirect here
    const returnUrl = encodeURIComponent(window.location.origin + redirectPath);
    // You might want to update the endpoint to match your backend route
    window.location.href = `${API_BASE}/api/Auth/ExternalLogin?provider=Facebook&returnUrl=${returnUrl}`;
  };

  return (
    <button
      type="button"
      onClick={handleFacebookLogin}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: '#4267B2', color: '#fff', border: 'none',
        borderRadius: '5px', padding: '0.5rem 1rem', cursor: 'pointer'
      }}
    >
      <img src={facebookIcon} alt="Facebook" style={{ width: 24, height: 24 }} />
      {children || "Sign in with Facebook"}
    </button>
  );
};

export default SignInWithFacebookButton;
