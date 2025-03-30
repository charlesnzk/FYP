import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';

const containerStyle = {
  padding: '2rem',
  maxWidth: '800px',
  margin: '0 auto',
  backgroundColor: '#f2f2f2',
  borderRadius: '0.5rem'
};

const headingStyle = {
  color: '#27ae60',
  textAlign: 'center',
  marginBottom: '1rem'
};

const textareaStyle = {
  width: '100%',
  height: '80px',
  padding: '0.75rem',
  fontSize: '1rem',
  border: '1px solid #ccc',
  borderRadius: '0.25rem'
};

const counterStyle = {
  textAlign: 'right',
  fontSize: '0.75rem',
  color: '#555'
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontSize: '1rem',
  marginTop: '0.5rem'
};

const postCardStyle = {
  border: '1px solid #ddd',
  borderRadius: '0.5rem',
  padding: '1rem',
  marginBottom: '1rem',
  backgroundColor: '#ffffff'
};

const smallTextStyle = {
  fontSize: '0.75rem',
  color: '#555'
};

const flexRowStyle = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'center'
};

const ProfilePosts = ({ profileId }) => {
  const { authToken, user: currentUser } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [error, setError] = useState(null);

  const fetchPosts = () => {
    axios
      .get(`http://127.0.0.1:8000/api/auth/posts/?profile_id=${profileId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then(response => {
        setPosts(response.data);
        setError(null);
      })
      .catch(error => {
        console.error("Error fetching posts:", error.response ? error.response.data : error);
        setError("Failed to load posts.");
      });
  };

  useEffect(() => {
    if (profileId) {
      fetchPosts();
    }
  }, [profileId, authToken]);

  const handleAddPost = () => {
    if (!newPost.trim()) return;
    if (newPost.length > 280) {
      alert("Your post exceeds 280 characters.");
      return;
    }
    console.log("Submitting post with:", { profile_id: profileId, text: newPost });
    axios
      .post(
        `http://127.0.0.1:8000/api/auth/posts/`,
        { profile_id: profileId, text: newPost },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      .then(response => {
        setNewPost('');
        fetchPosts();
      })
      .catch(error => {
        console.error("Error posting:", error.response ? error.response.data : error);
        setError("Error posting.");
      });
  };

  const handleDeletePost = (postId) => {
    axios
      .delete(`http://127.0.0.1:8000/api/auth/posts/${postId}/`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then(response => {
        fetchPosts();
      })
      .catch(error => {
        console.error("Error deleting post:", error.response ? error.response.data : error);
        setError("Error deleting post.");
      });
  };

  const startEditing = (post) => {
    setEditingPostId(post.id);
    setEditingText(post.text);
  };

  const cancelEditing = () => {
    setEditingPostId(null);
    setEditingText('');
  };

  const handleSaveEdit = (postId) => {
    if (!editingText.trim()) {
      alert("Post text cannot be empty.");
      return;
    }
    axios
      .patch(
        `http://127.0.0.1:8000/api/auth/posts/${postId}/`,
        { text: editingText },
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      .then(response => {
        setEditingPostId(null);
        setEditingText('');
        fetchPosts();
      })
      .catch(error => {
        console.error("Error updating post:", error.response ? error.response.data : error);
        setError("Error updating post.");
      });
  };

  const handleLike = (postId) => {
    axios
      .post(`http://127.0.0.1:8000/api/auth/posts/${postId}/like/`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then(response => {
        fetchPosts();
      })
      .catch(error => {
        console.error("Error liking post:", error.response ? error.response.data : error);
        setError("Error liking post.");
      });
  };

  const handleDislike = (postId) => {
    axios
      .post(`http://127.0.0.1:8000/api/auth/posts/${postId}/dislike/`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then(response => {
        fetchPosts();
      })
      .catch(error => {
        console.error("Error disliking post:", error.response ? error.response.data : error);
        setError("Error disliking post.");
      });
  };

  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>Posts</h3>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      <div style={{ marginBottom: '1rem' }}>
        <textarea
          placeholder="Share your thoughts..."
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          maxLength={280}
          style={textareaStyle}
        ></textarea>
        <div style={counterStyle}>
          {newPost.length}/280
        </div>
        <button onClick={handleAddPost} style={buttonStyle}>
          Submit Post
        </button>
      </div>
      {posts.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No posts yet. Be the first to share!</p>
      ) : (
        <div>
          {posts.map(post => {
            const originalTime = new Date(post.created_at);
            const updatedTime = new Date(post.updated_at);
            const isEdited = post.updated_at && post.updated_at !== post.created_at;
            return (
              <div key={post.id} style={postCardStyle}>
                <p style={{ margin: '0 0 0.5rem 0' }}>
                  <strong>{post.commenter_username}</strong>
                </p>
                {editingPostId === post.id ? (
                  <>
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      maxLength={280}
                      style={textareaStyle}
                    ></textarea>
                    <div style={flexRowStyle}>
                      <button onClick={() => handleSaveEdit(post.id)} style={buttonStyle}>Save</button>
                      <button onClick={cancelEditing} style={buttonStyle}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ margin: '0 0 0.5rem 0' }}>{post.text}</p>
                    <p style={smallTextStyle}>
                      Created: {originalTime.toLocaleString()}
                      {isEdited && ` | Edited: ${updatedTime.toLocaleString()}`}
                    </p>
                    <div style={flexRowStyle}>
                      <button onClick={() => handleLike(post.id)} style={buttonStyle}>
                        Like ({post.likes_count})
                      </button>
                      <button onClick={() => handleDislike(post.id)} style={buttonStyle}>
                        Dislike ({post.dislikes_count})
                      </button>
                    </div>
                    <div style={flexRowStyle}>
                      {currentUser && currentUser.id === post.commenter ? (
                        <>
                          <button onClick={() => handleDeletePost(post.id)} style={buttonStyle}>Delete</button>
                          <button onClick={() => startEditing(post)} style={buttonStyle}>Edit</button>
                        </>
                      ) : currentUser && currentUser.id === post.profile_user_id ? (
                        <button onClick={() => handleDeletePost(post.id)} style={buttonStyle}>Delete</button>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfilePosts;