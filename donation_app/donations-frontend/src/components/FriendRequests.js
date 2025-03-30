import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';

const containerStyle = {
  padding: '2rem',
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#f2f2f2',
  borderRadius: '0.5rem'
};

const headingStyle = {
  textAlign: 'center',
  color: '#27ae60'
};

const listStyle = {
  listStyle: 'none',
  padding: 0
};

const itemStyle = {
  border: '1px solid #ccc',
  borderRadius: '0.5rem',
  padding: '1rem',
  marginBottom: '1rem'
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontSize: '0.9rem'
};

const FriendRequests = () => {
  const { authToken } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  
  const fetchRequests = () => {
    axios.get('http://127.0.0.1:8000/api/auth/friend-requests/', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    .then(response => {
      setRequests(response.data);
      setError(null);
    })
    .catch(error => {
      console.error("Error fetching friend requests:", error.response ? error.response.data : error);
      setError("Failed to load friend requests.");
    });
  };
  
  useEffect(() => {
    fetchRequests();
  }, [authToken]);
  
  const handleUpdateRequest = (requestId, status) => {
    axios.patch(`http://127.0.0.1:8000/api/auth/friend-request/${requestId}/`, { status }, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    .then(response => {
      fetchRequests();
    })
    .catch(error => {
      console.error("Error updating friend request:", error.response ? error.response.data : error);
      alert("Failed to update friend request.");
    });
  };
  
  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Incoming Friend Requests</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {requests.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No pending friend requests.</p>
      ) : (
        <ul style={listStyle}>
          {requests.map(req => (
            <li key={req.id} style={itemStyle}>
              <p><strong>Add Friend:</strong> {req.from_username}</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={() => handleUpdateRequest(req.id, 'accepted')} style={buttonStyle}>Accept</button>
                <button onClick={() => handleUpdateRequest(req.id, 'rejected')} style={buttonStyle}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FriendRequests;