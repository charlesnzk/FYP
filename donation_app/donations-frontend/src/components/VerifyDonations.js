import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';

const containerStyle = {
  backgroundColor: '#f2f2f2',
  padding: '1.5rem',
  borderRadius: '0.5rem',
  maxWidth: '800px',
  margin: '2rem auto',
};

const headingStyle = {
  color: '#27ae60',
  textAlign: 'center',
  marginBottom: '1rem',
};

const cardStyle = {
  border: '1px solid #ccc',
  borderRadius: '0.5rem',
  padding: '1rem',
  marginBottom: '1rem',
  backgroundColor: '#fff',
  cursor: 'pointer',
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  marginRight: '0.5rem',
  marginTop: '0.5rem',
};

const selectStyle = {
  padding: '0.5rem',
  borderRadius: '0.25rem',
  border: '1px solid #ccc',
  fontSize: '0.9rem',
};

const inputStyle = {
  padding: '0.5rem',
  borderRadius: '0.25rem',
  border: '1px solid #ccc',
  fontSize: '0.9rem',
  marginBottom: '0.5rem',
  width: '100%',
};

const labelStyle = {
  display: 'block',
  fontWeight: 'bold',
  color: '#27ae60',
  marginBottom: '0.5rem',
};

const stepNavigationStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '1rem',
};

const VerifyDonations = () => {
  const { authToken } = useContext(AuthContext);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [updateData, setUpdateData] = useState({
    verification_status: '',
    intended_action: '',
    verification_comment: ''
  });
  const [loading, setLoading] = useState(true);

  const fetchPendingDonations = useCallback(() => {
    axios.get('http://127.0.0.1:8000/api/donations/', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((response) => {
        const pending = response.data.filter(
          donation => donation.verification_status === 'pending'
        );
        setPendingDonations(pending);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching pending donations:', error.response ? error.response.data : error);
        setLoading(false);
      });
  }, [authToken]);

  useEffect(() => {
    if (authToken) {
      fetchPendingDonations();
    }
  }, [authToken, fetchPendingDonations]);

  const handleSelectDonation = (donation) => {
    setSelectedDonation(donation);
    setUpdateData({
      verification_status: donation.verification_status,
      intended_action: donation.intended_action,
      verification_comment: donation.verification_comment || ''
    });
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = () => {
    if (!selectedDonation) return;
    if (!updateData.verification_status || !updateData.intended_action) {
      alert("Please select both verification status and intended action.");
      return;
    }
    if (!updateData.verification_comment) {
      alert("Please provide a verification comment.");
      return;
    }
    axios.patch(`http://127.0.0.1:8000/api/donations/verify/${selectedDonation.id}/`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(() => {
        alert("Donation evaluated successfully!");
        fetchPendingDonations();
        setSelectedDonation(null);
      })
      .catch(error => {
        console.error("Error updating donation:", error.response ? error.response.data : error);
        alert("Evaluation failed.");
      });
  };

  if (loading) return <div style={containerStyle}><h3 style={headingStyle}>Loading pending donations...</h3></div>;

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Verify Donations</h2>
      {pendingDonations.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No donations pending verification.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {pendingDonations.map(donation => (
            <li
              key={donation.id}
              style={cardStyle}
              onClick={() => handleSelectDonation(donation)}
            >
              <strong>{donation.item_name}</strong> submitted on {donation.donation_date} {donation.donation_time} by {donation.donor_username || donation.donor} – Status: {donation.verification_status}
            </li>
          ))}
        </ul>
      )}
      {selectedDonation && (
        <div style={{ ...cardStyle, backgroundColor: '#ecf0f1' }}>
          <h3>Evaluate Donation: {selectedDonation.item_name}</h3>
          <p><strong>Donor:</strong> {selectedDonation.donor_username || selectedDonation.donor}</p>
          <p><strong>Date/Time:</strong> {selectedDonation.donation_date} {selectedDonation.donation_time}</p>
          <p><strong>Method:</strong> {selectedDonation.donation_method}</p>
          {selectedDonation.donation_method === 'delivery' && (
            <>
              <p><strong>Postal Code:</strong> {selectedDonation.postal_code}</p>
              <p><strong>Weight Range:</strong> {selectedDonation.weight_range}</p>
            </>
          )}
          {selectedDonation.donation_method === 'dropoff' && (
            <p><strong>Dropoff Location:</strong> {selectedDonation.dropoff_location}</p>
          )}
          <p><strong>Category:</strong> {selectedDonation.category}</p>
          <p><strong>Description:</strong> {selectedDonation.description}</p>
          <p><strong>Intended Action:</strong> {selectedDonation.intended_action}</p>
          {selectedDonation.verification_comment && (
            <p><strong>Admin Comment:</strong> {selectedDonation.verification_comment}</p>
          )}
          <div style={{ marginTop: '1rem' }}>
            <strong>Images:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {selectedDonation.images && selectedDonation.images.length > 0 ? (
                selectedDonation.images.map(img => (
                  <img
                    key={img.id}
                    src={img.image}
                    alt={selectedDonation.item_name}
                    style={{ width: '80px', height: '80px', objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => window.open(img.image, '_blank')}
                  />
                ))
              ) : 'No images'}
            </div>
          </div>
          <hr style={{ margin: '1rem 0' }} />
          <div>
            <h4 style={{ color: '#27ae60' }}>Evaluation</h4>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Verification Status:</label>
              <select
                name="verification_status"
                value={updateData.verification_status}
                onChange={handleUpdateChange}
                style={inputStyle}
                required
              >
                <option value="">Select</option>
                <option value="verified">Verified (Proceed to Completion)</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Intended Action:</label>
              <select
                name="intended_action"
                value={updateData.intended_action}
                onChange={handleUpdateChange}
                style={inputStyle}
                required
              >
                <option value="">Select</option>
                <option value="donation">Donation</option>
                <option value="recycling">Recycling</option>
              </select>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Verification Comment:</label>
              <textarea
                name="verification_comment"
                value={updateData.verification_comment}
                onChange={handleUpdateChange}
                style={{ ...inputStyle, height: '80px' }}
                required
              ></textarea>
            </div>
            <div style={stepNavigationStyle}>
              <button onClick={handleUpdate} style={buttonStyle}>Submit Evaluation</button>
              <button onClick={() => setSelectedDonation(null)} style={buttonStyle}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyDonations;