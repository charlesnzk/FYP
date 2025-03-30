import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import ProfilePosts from './ProfilePosts';
import { useNavigate } from 'react-router-dom';

const DEFAULT_PROFILE_PICTURE = "http://127.0.0.1:8000/media/profile_pictures/Profile.jpg";

const sectionStyle = {
  marginTop: '1.5rem',
  padding: '1rem',
  backgroundColor: '#ffffff',
  border: '1px solid #ccc',
  borderRadius: '0.5rem'
};

const labelStyle = {
  fontWeight: 'bold',
  color: '#27ae60',
  marginBottom: '0.25rem',
  display: 'block'
};

const inputStyle = {
  width: '100%',
  padding: '0.5rem',
  border: '1px solid #ccc',
  borderRadius: '0.25rem',
  marginBottom: '0.75rem'
};

const buttonStyle = {
  padding: '0.75rem 1.5rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontSize: '1rem',
  marginRight: '1rem'
};

const Profile = () => {
  const { authToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: '',
    phone: '',
    address: '',
    bio: '',
    profile_picture: null,
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!authToken) {
      navigate('/login');
      return;
    }
    axios.get('http://127.0.0.1:8000/api/auth/profile/', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    .then(response => {
      setProfile(response.data);
      setFormData({
        username: response.data.username,
        email: response.data.email,
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        password: '',
        password2: '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        bio: response.data.bio || '',
        profile_picture: null,
      });
      setLoading(false);
    })
    .catch(err => {
      console.error('Error fetching profile:', err.response ? err.response.data : err);
      setLoading(false);
    });
  }, [authToken, navigate]);
  
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profile_picture' && files.length > 0) {
      setFormData(prev => ({ ...prev, profile_picture: files[0] }));
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email) {
      alert("Username and email are required.");
      return;
    }
    if (formData.password || formData.password2) {
      if (formData.password !== formData.password2) {
        alert("Passwords do not match.");
        return;
      }
      if (formData.password.length < 8) {
        alert("Password must be at least 8 characters long.");
        return;
      }
    }
    const data = new FormData();
    data.append('new_username', formData.username);
    data.append('new_email', formData.email);
    data.append('new_first_name', formData.first_name);
    data.append('new_last_name', formData.last_name);
    data.append('phone', formData.phone);
    data.append('address', formData.address);
    data.append('bio', formData.bio);
    if (formData.password) {
      data.append('new_password', formData.password);
    }
    if (formData.profile_picture) {
      data.append('profile_picture', formData.profile_picture);
    }
    axios.patch('http://127.0.0.1:8000/api/auth/profile/', data, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'multipart/form-data'
      },
    })
    .then(response => {
      setProfile(response.data);
      setEditing(false);
      alert("Profile updated successfully!");
      setFormData({
        username: response.data.username,
        email: response.data.email,
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        password: '',
        password2: '',
        phone: response.data.phone || '',
        address: response.data.address || '',
        bio: response.data.bio || '',
        profile_picture: null,
      });
      setPreview(null);
    })
    .catch(err => {
      console.error('Error updating profile:', err.response ? err.response.data : err);
      alert('Profile update failed.');
    });
  };

  if (loading) return <div style={{ textAlign: 'center' }}>Loading profile...</div>;
  if (!profile) return <div style={{ textAlign: 'center' }}>Error loading profile.</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', backgroundColor: '#f2f2f2', borderRadius: '0.5rem' }}>
      <h2 style={{ textAlign: 'center', color: '#27ae60', marginBottom: '1rem' }}>My Profile</h2>
      {editing ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Username:</label>
            <input 
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Email:</label>
            <input 
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>First Name:</label>
            <input 
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Last Name:</label>
            <input 
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Phone:</label>
            <input 
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Address:</label>
            <input 
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Bio:</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              style={{ ...inputStyle, height: '80px' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Profile Picture:</label>
            <input 
              type="file" 
              name="profile_picture" 
              onChange={handleChange} 
              style={inputStyle} 
            />
            {preview && (
              <img 
                src={preview} 
                alt="Preview" 
                style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px', marginTop: '0.5rem' }}
              />
            )}
          </div>
          <div>
            <label style={labelStyle}>New Password:</label>
            <input 
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password:</label>
            <input 
              type="password"
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button type="submit" style={buttonStyle}>Save Changes</button>
            <button type="button" onClick={() => { setEditing(false); setPreview(null); }} style={buttonStyle}>Cancel</button>
          </div>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <img 
              src={profile.profile_picture ? profile.profile_picture : DEFAULT_PROFILE_PICTURE} 
              alt="Profile" 
              style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
            />
            <div style={{ textAlign: 'center' }}>
              <p><strong>Username:</strong> {profile.username}</p>
              <p><strong>First Name:</strong> {profile.first_name}</p>
              <p><strong>Last Name:</strong> {profile.last_name}</p>
              <p><strong>Bio:</strong> {profile.bio}</p>
            </div>
          </div>
          <div style={sectionStyle}>
            <h3 style={{ color: '#27ae60' }}>Contact Details</h3>
            <p><strong>Phone:</strong> {profile.phone || "Not provided"}</p>
            <p><strong>Address:</strong> {profile.address || "Not provided"}</p>
            <p><strong>Email:</strong> {profile.email || "Not provided"}</p>
          </div>
          <div style={sectionStyle}>
            <h3 style={{ color: '#27ae60' }}>Friends List</h3>
            {profile.friends && profile.friends.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {profile.friends.map(friend => (
                  <li key={friend.id}>{friend.username}</li>
                ))}
              </ul>
            ) : (
              <p>No friends added yet.</p>
            )}
          </div>
          <div style={sectionStyle}>
            <h3 style={{ color: '#27ae60' }}>Posts</h3>
            <ProfilePosts profileId={profile.id} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <button onClick={() => setEditing(true)} style={buttonStyle}>Edit Profile</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;