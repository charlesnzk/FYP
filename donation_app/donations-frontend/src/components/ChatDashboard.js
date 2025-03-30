import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const containerStyle = {
  backgroundColor: '#ffffff',
  padding: '1.5rem',
  borderRadius: '0.5rem',
  maxWidth: '800px',
  margin: '2rem auto',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem'
};

const headingStyle = {
  textAlign: 'center',
  color: '#27ae60',
  fontSize: '1.5rem',
  marginBottom: '1rem'
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  alignSelf: 'center'
};

const linkButtonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#3498db',
  color: '#fff',
  borderRadius: '0.25rem',
  textDecoration: 'none',
  alignSelf: 'center'
};

const chatRoomLinkStyle = {
  ...{
    padding: '0.5rem 1rem',
    backgroundColor: '#27ae60',
    color: '#fff',
    borderRadius: '0.25rem',
    textDecoration: 'none',
    display: 'block',
    textAlign: 'center'
  }
};

const listStyle = {
  listStyle: 'none',
  padding: 0
};

const listItemStyle = {
  marginBottom: '0.75rem',
  display: 'flex',
  justifyContent: 'center'
};

const ChatDashboard = () => {
  const { authToken, user } = useContext(AuthContext);
  const [chatRooms, setChatRooms] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchChatRooms = () => {
    axios
      .get('http://127.0.0.1:8000/api/chat/rooms/', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then(response => {
        setChatRooms(response.data);
        setError(null);
      })
      .catch(err => {
        console.error("Error fetching chatrooms:", err.response ? err.response.data : err);
        setError("Failed to load chatrooms.");
      });
  };

  useEffect(() => {
    fetchChatRooms();
  }, [authToken]);

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Chat Dashboard</h2>
      {user && user.role !== 'donor' && (
        <button 
          onClick={() => navigate('/create-chat-room')}
          style={buttonStyle}
        >
          Create Chat Room
        </button>
      )}
      {user && user.role === 'donor' && (
        <Link 
          to="/create-chat-ticket" 
          style={linkButtonStyle}
        >
          Contact Admin
        </Link>
      )}
      <div>
        <h3 style={{ color: '#27ae60', marginBottom: '0.5rem', textAlign: 'center' }}>My Chats</h3>
        {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
        {chatRooms.length === 0 ? (
          <p style={{ textAlign: 'center' }}>No chat available.</p>
        ) : (
          <ul style={listStyle}>
            {chatRooms.map(room => (
              <li key={room.id} style={listItemStyle}>
                <Link to={`/chat/${room.slug}`} style={chatRoomLinkStyle}>
                  {room.name || "Private Chat"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatDashboard;