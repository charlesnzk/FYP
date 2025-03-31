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

const sectionHeadingStyle = {
  color: '#27ae60',
  borderBottom: '1px solid #ccc',
  paddingBottom: '0.5rem',
  marginBottom: '1rem',
};

const cardStyle = {
  border: '1px solid #ccc',
  borderRadius: '0.5rem',
  padding: '1rem',
  marginBottom: '1rem',
  backgroundColor: '#fff',
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  marginRight: '0.5rem',
};

const selectStyle = {
  padding: '0.5rem',
  borderRadius: '0.25rem',
  border: '1px solid #ccc',
  fontSize: '0.9rem',
};

const DonationStatus = () => {
  const { authToken } = useContext(AuthContext);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [completedDonations, setCompletedDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [finalStatus, setFinalStatus] = useState('completed');

  const fetchDonations = useCallback(() => {
    axios
      .get('http://127.0.0.1:8000/api/donations/', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then(response => {
        const allDonations = response.data;
        const pending = allDonations.filter(donation =>
          donation.verification_status === 'pending' ||
          donation.verification_status === 'verified' ||
          donation.verification_status === 'pending_cancellation'
        );
        const completed = allDonations.filter(donation =>
          donation.verification_status === 'completed' ||
          donation.verification_status === 'rejected' ||
          donation.verification_status === 'cancelled'
        );
        setPendingDonations(pending);
        setCompletedDonations(completed);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching donations:", error.response ? error.response.data : error);
        setLoading(false);
      });
  }, [authToken]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const getTicketStatusAdmin = (donation) => {
    if (donation.verification_status === 'pending') {
      return "Pending Evaluation";
    }
    if (donation.verification_status === 'verified') {
      return donation.donation_method === 'delivery'
        ? "Pending Dropoff"
        : donation.donation_method === 'dropoff'
        ? "Pending Pickup"
        : "Verified";
    }
    if (donation.verification_status === 'pending_cancellation') {
      return "Cancellation Requested";
    }
    return donation.verification_status.charAt(0).toUpperCase() + donation.verification_status.slice(1);
  };

  const handleApproveCancellation = (donationId) => {
    axios.patch(`http://127.0.0.1:8000/api/donations/approve-cancellation/${donationId}/`, {}, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    .then(() => {
      alert("Cancellation approved successfully!");
      fetchDonations();
    })
    .catch(error => {
      console.error("Error approving cancellation:", error.response ? error.response.data : error);
      alert("Error approving cancellation.");
    });
  };

  const handleFinalize = (donationId) => {
    axios.patch(`http://127.0.0.1:8000/api/donations/complete/${donationId}/`, { verification_status: finalStatus }, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
    .then(() => {
      alert("Donation marked as completed!");
      fetchDonations();
    })
    .catch(error => {
      console.error("Error completing donation:", error.response ? error.response.data : error);
      alert("Error completing donation.");
    });
  };

  if (loading) return <div style={containerStyle}><h3 style={headingStyle}>Loading donations...</h3></div>;

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Donation Status Overview</h2>
      
      <section>
        <h3 style={sectionHeadingStyle}>Pending Donations</h3>
        {pendingDonations.length === 0 ? (
          <p>No pending donations.</p>
        ) : (
          pendingDonations.map(donation => (
            <div key={donation.id} style={cardStyle}>
              <h4>{donation.item_name}</h4>
              <p><strong>Date/Time:</strong> {donation.donation_date} {donation.donation_time}</p>
              <p><strong>Status:</strong> {getTicketStatusAdmin(donation)}</p>
              <p><strong>Donor:</strong> {donation.donor_username || donation.donor}</p>
              <button onClick={() => setExpandedId(expandedId === donation.id ? null : donation.id)} style={buttonStyle}>
                {expandedId === donation.id ? "Hide Details" : "View Details"}
              </button>
              {expandedId === donation.id && (
                <div style={{ marginTop: '1rem' }}>
                  <p><strong>Method:</strong> {donation.donation_method}</p>
                  {donation.donation_method === 'delivery' && (
                    <>
                      <p><strong>Postal Code:</strong> {donation.postal_code}</p>
                      <p><strong>Weight Range:</strong> {donation.weight_range}</p>
                    </>
                  )}
                  {donation.donation_method === 'dropoff' && (
                    <p><strong>Dropoff Location:</strong> {donation.dropoff_location}</p>
                  )}
                  <p><strong>Category:</strong> {donation.category}</p>
                  <p><strong>Description:</strong> {donation.description}</p>
                  <p><strong>Intended Action:</strong> {donation.intended_action}</p>
                  {donation.verification_comment && (
                    <p><strong>Admin Comment:</strong> {donation.verification_comment}</p>
                  )}
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>Images:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {donation.images && donation.images.length > 0 ? donation.images.map(img => (
                        <img
                          key={img.id}
                          src={img.image}
                          alt={donation.item_name}
                          style={{ width: '80px', height: '80px', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => window.open(img.image, '_blank')}
                        />
                      )) : 'No images'}
                    </div>
                  </div>
                  {donation.verification_status === 'verified' && (
                    <div style={{ marginTop: '1rem' }}>
                      <label style={{ fontWeight: 'bold', marginRight: '0.5rem' }}>Finalize Donation:</label>
                      <select
                        value={finalStatus}
                        onChange={(e) => setFinalStatus(e.target.value)}
                        style={selectStyle}
                      >
                        <option value="completed">Completed (Fulfilled/Delivered)</option>
                        <option value="completed">Not Fulfilled</option>
                      </select>
                      <button onClick={() => handleFinalize(donation.id)} style={{ ...buttonStyle, marginLeft: '0.5rem' }}>
                        Finalize
                      </button>
                    </div>
                  )}
                  {donation.verification_status === 'pending_cancellation' && (
                    <button onClick={() => handleApproveCancellation(donation.id)} style={buttonStyle}>
                      Approve Cancellation
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </section>
      
      <section>
        <h3 style={sectionHeadingStyle}>Completed Donations</h3>
        {completedDonations.length === 0 ? (
          <p>No completed donations.</p>
        ) : (
          completedDonations.map(donation => (
            <div key={donation.id} style={cardStyle}>
              <h4>{donation.item_name}</h4>
              <p><strong>Date/Time:</strong> {donation.donation_date} {donation.donation_time}</p>
              <p><strong>Status:</strong> {donation.verification_status.charAt(0).toUpperCase() + donation.verification_status.slice(1)}</p>
              <p><strong>Donor:</strong> {donation.donor_username || donation.donor}</p>
              <button onClick={() => setExpandedId(expandedId === donation.id ? null : donation.id)} style={buttonStyle}>
                {expandedId === donation.id ? "Hide Details" : "View Details"}
              </button>
              {expandedId === donation.id && (
                <div style={{ marginTop: '1rem' }}>
                  <p><strong>Method:</strong> {donation.donation_method}</p>
                  {donation.donation_method === 'delivery' && (
                    <>
                      <p><strong>Delivery postal Code:</strong> {donation.postal_code}</p>
                      <p><strong>Weight Range:</strong> {donation.weight_range}</p>
                    </>
                  )}
                  {donation.donation_method === 'dropoff' && (
                    <p><strong>Dropoff Location:</strong> {donation.dropoff_location}</p>
                  )}
                  <p><strong>Category:</strong> {donation.category}</p>
                  <p><strong>Description:</strong> {donation.description}</p>
                  <p><strong>Intended Action:</strong> {donation.intended_action}</p>
                  {donation.verification_comment && (
                    <p><strong>Admin Comment:</strong> {donation.verification_comment}</p>
                  )}
                  <div style={{ marginTop: '0.75rem' }}>
                    <strong>Images:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {donation.images && donation.images.length > 0 ? donation.images.map(img => (
                        <img
                          key={img.id}
                          src={img.image}
                          alt={donation.item_name}
                          style={{ width: '80px', height: '80px', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => window.open(img.image, '_blank')}
                        />
                      )) : 'No images'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default DonationStatus;