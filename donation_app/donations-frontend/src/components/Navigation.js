import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const navContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.75rem 1rem',
  backgroundColor: '#ffffff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  position: 'sticky',
  top: 0,
  zIndex: 1000,
};

const navLeft = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const navCenter = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  flexGrow: 1,
  justifyContent: 'center',
};

const navRight = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const logoStyle = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  color: '#27ae60',
  textDecoration: 'none',
};

const linkStyle = {
  textDecoration: 'none',
  color: '#27ae60',
  fontWeight: '500',
  fontSize: '1rem',
};

const buttonStyle = {
  background: 'none',
  border: 'none',
  color: '#27ae60',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '1rem',
};

const Navigation = () => {
  const { authToken, user, logoutUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const isLanding = location.pathname === '/';

  return (
    <nav style={navContainer}>
      <div style={navLeft}>
        <Link to={authToken ? "/home" : "/"} style={logoStyle}>DonationApp</Link>
      </div>

      {!isLanding && authToken && (
        <div style={navCenter}>
          <Link to="/home" style={linkStyle}>Home</Link>
          <Link to="/profile" style={linkStyle}>My Profile</Link>
          <Link to="/chat" style={linkStyle}>Chat</Link>
          <Link to="/user-search" style={linkStyle}>Search Users</Link>
          <Link to="/friend-requests" style={linkStyle}>Friend Requests</Link>
          {user?.role === 'donor' && (
            <>
              <Link to="/donate" style={linkStyle}>Donate</Link>
              <Link to="/my-donations" style={linkStyle}>My Donations</Link>
            </>
          )}
          {user && (user.role === 'volunteer' || user.role === 'moderator' || user.role === 'superuser') && (
            <>
              <Link to="/chat-tickets" style={linkStyle}>Chat Requests</Link>
              <Link to="/verify-donations" style={linkStyle}>Verify Donations</Link>
              <Link to="/donation-status" style={linkStyle}>Donation Status</Link>
            </>
          )}
          <Link to="/resolved-tickets" style={linkStyle}>Resolved Tickets</Link>
          {user && (user.role === 'moderator' || user.role === 'superuser') && (
            <Link to="/promote-users" style={linkStyle}>Promote Users</Link>
          )}
        </div>
      )}

      <div style={navRight}>
        {!authToken ? (
          <>
            <Link to="/register" style={linkStyle}>Register</Link>
            <Link to="/login" style={linkStyle}>Login</Link>
          </>
        ) : (
          <button onClick={handleLogout} style={buttonStyle}>Logout</button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;