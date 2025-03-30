import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import ProfilePosts from './ProfilePosts';

const DEFAULT_PROFILE_PICTURE = "http://127.0.0.1:8000/media/profile_pictures/Profile.jpg";

const containerStyle = {
  padding: '2rem',
  maxWidth: '800px',
  margin: '0 auto',
  backgroundColor: '#f2f2f2',
  borderRadius: '0.5rem'
};

const headingStyle = {
  textAlign: 'center',
  color: '#27ae60'
};

const sectionStyle = {
  marginTop: '1.5rem',
  padding: '1rem',
  backgroundColor: '#ffffff',
  border: '1px solid #ccc',
  borderRadius: '0.5rem'
};

const buttonStyle = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontSize: '1rem'
};

const PublicProfile = () => {
  const { id } = useParams();
  const { authToken, user } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
  const [sentRequests, setSentRequests] = useState([]);
  const [error, setError] = useState(null);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  
  useEffect(() => {
    axios.get(`http://127.0.0.1:8000/api/auth/public-profile/${id}/`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    .then(response => {
      setProfileData(response.data);
      setError(null);
    })
    .catch(error => {
      console.error("Error fetching public profile:", error.response ? error.response.data : error);
      setError("Error loading profile.");
    });
  }, [id, authToken]);
  
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/auth/friend-request-sent/', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    .then(response => {
      setSentRequests(response.data);
    })
    .catch(error => {
      console.error("Error fetching sent friend requests:", error.response ? error.response.data : error);
    });
  }, [authToken]);
  
  const handleSendFriendRequest = () => {
    axios.post('http://127.0.0.1:8000/api/auth/friend-request/', { to_profile_id: id }, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    .then(response => {
      alert("Friend request sent!");
      setFriendRequestSent(true);
    })
    .catch(error => {
      console.error("Error sending friend request:", error.response ? error.response.data : error);
      alert("Error sending friend request.");
    });
  };
  
  if (error) return <div style={{ textAlign: 'center' }}>{error}</div>;
  if (!profileData) return <div style={{ textAlign: 'center' }}>Loading profile...</div>;

  const isFriend = profileData.friends && profileData.friends.some(friend => friend.id === user.id);
  const alreadySent = sentRequests && sentRequests.some(fr => fr.to_user === profileData.id);

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>{profileData.username}'s Profile</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <img 
          src={profileData.profile_picture ? profileData.profile_picture : DEFAULT_PROFILE_PICTURE} 
          alt="Profile" 
          style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
        />
        <div style={{ textAlign: 'center' }}>
          <p><strong>Username:</strong> {profileData.username}</p>
          <p><strong>First Name:</strong> {profileData.first_name}</p>
          <p><strong>Last Name:</strong> {profileData.last_name}</p>
        </div>
      </div>
      
      {user && user.id !== profileData.user_id && !alreadySent && !friendRequestSent && !isFriend && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button onClick={handleSendFriendRequest} style={buttonStyle}>Send Friend Request</button>
        </div>
      )}

      {user && user.role !== 'donor' && (
        <div style={sectionStyle}>
          <h3 style={{ color: '#27ae60' }}>Contact Details</h3>
          <p><strong>Phone:</strong> {profileData.phone || "Not provided"}</p>
          <p><strong>Address:</strong> {profileData.address || "Not provided"}</p>
          <p><strong>Email:</strong> {profileData.email || "Not provided"}</p>
        </div>
      )}
      <div style={sectionStyle}>
        <h3 style={{ color: '#27ae60' }}>Posts</h3>
        <ProfilePosts profileId={profileData.id} />
      </div>
      <div style={sectionStyle}>
        <h3 style={{ color: '#27ae60' }}>Friends List</h3>
        {profileData.friends && profileData.friends.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {profileData.friends.map(friend => (
              <li key={friend.id}>{friend.username}</li>
            ))}
          </ul>
        ) : (
          <p>No friends added yet.</p>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;