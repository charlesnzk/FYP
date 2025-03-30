import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const containerStyle = {
  padding: '1.5rem',
  maxWidth: '600px',
  margin: '2rem auto',
  backgroundColor: '#ffffff',
  borderRadius: '0.5rem',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const headingStyle = {
  textAlign: 'center',
  color: '#27ae60',
  marginBottom: '1rem',
  fontSize: '1.5rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #ccc',
  borderRadius: '0.25rem',
  fontSize: '1rem',
  marginBottom: '1rem'
};

const listStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0
};

const listItemStyle = {
  margin: '0.75rem 0',
  paddingBottom: '0.5rem',
  borderBottom: '1px solid #ddd',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const buttonStyle = {
  padding: '0.5rem 0.75rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontSize: '0.9rem'
};

const infoTextStyle = {
  textAlign: 'center',
  color: '#888',
  fontSize: '1rem'
};

const ChatSearch = () => {
  const { authToken, user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchTerm.trim() !== '') {
      axios
        .get(`http://127.0.0.1:8000/api/auth/chat-search/?search=${searchTerm}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        .then((response) => setUsers(response.data))
        .catch((err) =>
          console.error("Error searching users:", err.response ? err.response.data : err)
        );
    } else {
      setUsers([]);
    }
  }, [searchTerm, authToken]);

  const startChat = (otherUser) => {
    axios
      .post(
        'http://127.0.0.1:8000/api/chat/rooms/one-to-one/',
        { username: otherUser.username },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      .then((res) => {
        const { room_slug } = res.data;
        navigate(`/chat/${room_slug}`);
      })
      .catch((err) => {
        console.error("Error starting chat:", err.response ? err.response.data : err);
        alert("Failed to start chat.");
      });
  };

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Start a Chat</h2>
      <input
        type="text"
        placeholder="Search for friends..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={inputStyle}
      />
      {searchTerm.trim() === '' ? (
        <p style={infoTextStyle}>Enter other's username to find users.</p>
      ) : (
        <ul style={listStyle}>
          {users.map((u) => (
            <li key={u.id} style={listItemStyle}>
              <span style={{ fontSize: '1rem', color: '#333' }}>
                {u.username} ({u.first_name} {u.last_name})
              </span>
              {u.id !== user.id && (
                <button onClick={() => startChat(u)} style={buttonStyle}>
                  Start Chat
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ChatSearch;