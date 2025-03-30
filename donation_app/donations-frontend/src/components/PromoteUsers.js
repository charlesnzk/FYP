import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';

const containerStyle = {
  backgroundColor: '#f2f2f2',
  padding: '1.5rem',
  borderRadius: '0.5rem',
  maxWidth: '900px',
  margin: '2rem auto',
};

const headingStyle = {
  color: '#27ae60',
  textAlign: 'center',
  marginBottom: '1rem',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle = {
  border: '1px solid #ccc',
  padding: '0.75rem',
  backgroundColor: '#e6e6e6',
  color: '#27ae60',
  textAlign: 'left',
};

const tdStyle = {
  border: '1px solid #ccc',
  padding: '0.75rem',
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  marginRight: '0.5rem',
  fontSize: '0.9rem',
};

const PromoteUsers = () => {
  const { authToken, user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/auth/users/', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(response => {
        console.log("User list response:", response.data);
        setUsers(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching users:", error.response ? error.response.data : error);
        setLoading(false);
      });
  }, [authToken]);

  const handlePromote = (userId, newRole) => {
    axios.patch(`http://127.0.0.1:8000/api/auth/promote/${userId}/`, { role: newRole }, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(response => {
        setMessage('User role updated successfully!');
        axios.get('http://127.0.0.1:8000/api/auth/users/', {
          headers: { Authorization: `Bearer ${authToken}` },
        }).then(response => setUsers(response.data));
      })
      .catch(error => {
        console.error("Promotion error:", error.response ? error.response.data : error);
        setMessage("Promotion failed.");
      });
  };

  if (loading) return <div style={containerStyle}><h2 style={headingStyle}>Loading users...</h2></div>;
  if (users.length === 0)
    return <div style={containerStyle}><h2 style={headingStyle}>No users found or you don't have permission to view users.</h2></div>;

  const currentUserRole = currentUser?.role || '';

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Promote Users</h2>
      {message && <p style={{ textAlign: 'center', color: '#27ae60' }}>{message}</p>}
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Username</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Current Role</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(targetUser => {
            const targetRole = targetUser.role || "donor";

            if (targetRole === 'superuser') {
              return (
                <tr key={targetUser.id}>
                  <td style={tdStyle}>{targetUser.username}</td>
                  <td style={tdStyle}>{targetUser.email}</td>
                  <td style={tdStyle}>{targetRole}</td>
                  <td style={tdStyle}>No actions</td>
                </tr>
              );
            }

            if (currentUserRole === 'moderator') {
              if (targetRole === 'moderator') {
                return (
                  <tr key={targetUser.id}>
                    <td style={tdStyle}>{targetUser.username}</td>
                    <td style={tdStyle}>{targetUser.email}</td>
                    <td style={tdStyle}>{targetRole}</td>
                    <td style={tdStyle}>No actions</td>
                  </tr>
                );
              }
              return (
                <tr key={targetUser.id}>
                  <td style={tdStyle}>{targetUser.username}</td>
                  <td style={tdStyle}>{targetUser.email}</td>
                  <td style={tdStyle}>{targetRole}</td>
                  <td style={tdStyle}>
                    {targetRole !== 'donor' && (
                      <button onClick={() => handlePromote(targetUser.id, 'donor')} style={buttonStyle}>
                        Set as Donor
                      </button>
                    )}
                    {targetRole !== 'volunteer' && (
                      <button onClick={() => handlePromote(targetUser.id, 'volunteer')} style={buttonStyle}>
                        Set as Volunteer
                      </button>
                    )}
                  </td>
                </tr>
              );
            }

            if (currentUserRole === 'superuser') {
              return (
                <tr key={targetUser.id}>
                  <td style={tdStyle}>{targetUser.username}</td>
                  <td style={tdStyle}>{targetUser.email}</td>
                  <td style={tdStyle}>{targetRole}</td>
                  <td style={tdStyle}>
                    {targetRole !== 'donor' && (
                      <button onClick={() => handlePromote(targetUser.id, 'donor')} style={buttonStyle}>
                        Set as Donor
                      </button>
                    )}
                    {targetRole !== 'volunteer' && (
                      <button onClick={() => handlePromote(targetUser.id, 'volunteer')} style={buttonStyle}>
                        Set as Volunteer
                      </button>
                    )}
                    {targetRole !== 'moderator' && (
                      <button onClick={() => handlePromote(targetUser.id, 'moderator')} style={buttonStyle}>
                        Set as Moderator
                      </button>
                    )}
                  </td>
                </tr>
              );
            }

            return (
              <tr key={targetUser.id}>
                <td style={tdStyle}>{targetUser.username}</td>
                <td style={tdStyle}>{targetUser.email}</td>
                <td style={tdStyle}>{targetRole}</td>
                <td style={tdStyle}>No actions</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PromoteUsers;