import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

const generateTimeOptions = () => {
  const options = [];
  const startHour = 9;
  const endHour = 21;
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute of [0, 30]) {
      if (hour === endHour && minute > 0) continue;
      const hh = hour.toString().padStart(2, '0');
      const mm = minute.toString().padStart(2, '0');
      options.push(`${hh}:${mm}`);
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

const containerStyle = {
  backgroundColor: '#f2f2f2',
  padding: '1.5rem',
  borderRadius: '0.5rem',
  maxWidth: '500px',
  margin: '2rem auto'
};

const headingStyle = {
  color: '#27ae60',
  textAlign: 'center',
  marginBottom: '1rem'
};

const formGroupStyle = {
  marginBottom: '1rem'
};

const labelStyle = {
  display: 'block',
  fontWeight: 'bold',
  color: '#27ae60',
  marginBottom: '0.5rem'
};

const inputStyle = {
  width: '100%',
  padding: '0.5rem',
  border: '1px solid #ccc',
  borderRadius: '0.25rem',
  fontSize: '0.9rem'
};

const buttonStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#27ae60',
  color: '#fff',
  border: 'none',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontSize: '1rem',
  marginRight: '1rem'
};

const stepNavigationStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: '1rem'
};

const DonationForm = () => {
  const { authToken, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const tomorrowStr = getTomorrowDate();

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const [selectedImages, setSelectedImages] = useState([]);

  const [formData, setFormData] = useState({
    donation_method: '',
    donation_date: '',
    donation_time: '',
    postal_code: '',
    weight_range: '',
    dropoff_location: '',
    item_name: '',
    category: '',
    description: '',
    intended_action: '',
    profile: {
      new_email: '',
      new_first_name: '',
      new_last_name: '',
      phone: '',
      address: '',
      bio: ''
    }
  });

  useEffect(() => {
    if (authToken) {
      axios.get('http://127.0.0.1:8000/api/auth/profile/', {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then(response => {
        const data = response.data;
        setFormData(prev => ({
          ...prev,
          profile: {
            new_email: data.email || '',
            new_first_name: data.first_name || '',
            new_last_name: data.last_name || '',
            phone: data.phone || '',
            address: data.address || '',
            bio: data.bio || ''
          }
        }));
      })
      .catch(error => {
        console.error('Error fetching profile:', error.response ? error.response.data : error);
      });
    }
  }, [authToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in formData.profile) {
      setFormData(prev => ({
        ...prev,
        profile: { ...prev.profile, [name]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setSelectedImages(prev => [...prev, ...newImages]);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setSelectedImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    } else {
      alert("Please complete all required fields for this step.");
    }
  };

  const prevStep = () => {
    if (!submitted) {
      setStep(prev => prev - 1);
    }
  };

  const validateStep = () => {
    const stepErrors = {};
    if (step === 1) {
      if (!formData.donation_method) stepErrors.donation_method = "Select a donation method.";
      if (!formData.donation_date) stepErrors.donation_date = "Select a donation date.";
      if (!formData.donation_time) stepErrors.donation_time = "Select a donation time.";
    } else if (step === 2) {
      if (formData.donation_method === 'delivery') {
        if (!formData.postal_code) stepErrors.postal_code = "Delivery postal code is required.";
        if (!formData.weight_range) stepErrors.weight_range = "Select a weight range.";
      } else if (formData.donation_method === 'dropoff') {
        if (!formData.dropoff_location) stepErrors.dropoff_location = "Select a dropoff location.";
      }
    } else if (step === 3) {
      if (!formData.intended_action) stepErrors.intended_action = "Select intended action.";
      if (!formData.item_name) stepErrors.item_name = "Item name is required.";
      if (!formData.category) stepErrors.category = "Select a category.";
      if (selectedImages.length === 0) stepErrors.images = "At least one image is required.";
    } else if (step === 4) {
      if (!formData.profile.new_email) stepErrors.new_email = "Email is required.";
      if (!formData.profile.phone) stepErrors.phone = "Phone is required.";
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) {
      alert("Please complete all required fields before submitting.");
      return;
    }
    try {
      const profileData = new FormData();
      profileData.append('new_first_name', formData.profile.new_first_name);
      profileData.append('new_last_name', formData.profile.new_last_name);
      profileData.append('new_email', formData.profile.new_email);
      profileData.append('phone', formData.profile.phone);
      profileData.append('address', formData.profile.address);
      profileData.append('bio', formData.profile.bio);
      if (formData.profile.profile_picture) {
        profileData.append('profile_picture', formData.profile.profile_picture);
      }
      await axios.patch('http://127.0.0.1:8000/api/auth/profile/', profileData, {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data'
        },
      });

      const donationData = new FormData();
      donationData.append('donor', user.id);
      donationData.append('donation_method', formData.donation_method);
      donationData.append('donation_date', formData.donation_date);
      donationData.append('donation_time', formData.donation_time);
      if (formData.donation_method === 'delivery') {
        donationData.append('postal_code', formData.postal_code);
        donationData.append('weight_range', formData.weight_range);
      } else if (formData.donation_method === 'dropoff') {
        donationData.append('dropoff_location', formData.dropoff_location);
      }
      donationData.append('item_name', formData.item_name);
      donationData.append('category', formData.category);
      donationData.append('description', formData.description);
      donationData.append('intended_action', formData.intended_action);
      selectedImages.forEach(imageObj => {
        donationData.append('images', imageObj.file);
      });

      await axios.post('http://127.0.0.1:8000/api/donations/', donationData, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      alert("Donation submitted successfully!");
      setSubmitted(true);
      navigate('/my-donations');
    } catch (error) {
      console.error("Error submitting donation:", error.response ? error.response.data : error);
      alert("Donation submission failed.");
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h3 style={headingStyle}>Step 1: Choose Donation Method, Date & Time</h3>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Donation Method:</label>
              <select 
                name="donation_method" 
                value={formData.donation_method} 
                onChange={handleChange} 
                style={inputStyle} 
                required
              >
                <option value="">Select</option>
                <option value="delivery">Delivery</option>
                <option value="dropoff">Dropoff</option>
              </select>
              {errors.donation_method && <div style={{ color: 'red' }}>{errors.donation_method}</div>}
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Donation Date:</label>
              <input
                type="date"
                name="donation_date"
                value={formData.donation_date}
                onChange={handleChange}
                min={tomorrowStr}
                style={inputStyle}
                required
              />
              {errors.donation_date && <div style={{ color: 'red' }}>{errors.donation_date}</div>}
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Donation Time:</label>
              <select 
                name="donation_time" 
                value={formData.donation_time} 
                onChange={handleChange} 
                style={inputStyle}
                required
              >
                <option value="">Select a time</option>
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              <div style={{ fontSize: '0.875rem', color: '#555', marginTop: '0.25rem' }}>
                Operating hours: 09:00 AM – 09:00 PM.
              </div>
              {errors.donation_time && <div style={{ color: 'red' }}>{errors.donation_time}</div>}
            </div>
            <div style={stepNavigationStyle}>
              <div></div>
              <button type="button" onClick={nextStep} style={buttonStyle}>Next</button>
            </div>
          </div>
        );
      case 2:
        return (
          <div>
            <h3 style={headingStyle}>Step 2: Provide Location Details</h3>
            {formData.donation_method === 'delivery' ? (
              <>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Delivery postal Code:</label>
                  <input 
                    type="text" 
                    name="postal_code" 
                    value={formData.postal_code} 
                    onChange={handleChange} 
                    style={inputStyle}
                    required
                  />
                  {errors.postal_code && <div style={{ color: 'red' }}>{errors.postal_code}</div>}
                </div>
                <div style={formGroupStyle}>
                  <label style={labelStyle}>Weight Range:</label>
                  <select 
                    name="weight_range" 
                    value={formData.weight_range} 
                    onChange={handleChange} 
                    style={inputStyle}
                    required
                  >
                    <option value="">Select</option>
                    <option value="<5">Less than 5kg</option>
                    <option value="5-10">5 to 10kg</option>
                    <option value="10-20">10 to 20kg</option>
                    <option value="20+">More than 20kg</option>
                  </select>
                  {errors.weight_range && <div style={{ color: 'red' }}>{errors.weight_range}</div>}
                </div>
              </>
            ) : formData.donation_method === 'dropoff' ? (
              <div style={formGroupStyle}>
                <label style={labelStyle}>Dropoff Location:</label>
                <select 
                  name="dropoff_location" 
                  value={formData.dropoff_location} 
                  onChange={handleChange} 
                  style={inputStyle}
                  required
                >
                  <option value="">Select</option>
                  <option value="location1">Location 1</option>
                  <option value="location2">Location 2</option>
                </select>
                {errors.dropoff_location && <div style={{ color: 'red' }}>{errors.dropoff_location}</div>}
              </div>
            ) : null}
            <div style={stepNavigationStyle}>
              <button type="button" onClick={prevStep} style={buttonStyle}>Back</button>
              <button type="button" onClick={nextStep} style={buttonStyle}>Next</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h3 style={headingStyle}>Step 3: Donation Item Details</h3>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Intended Action:</label>
              <div>
                <input 
                  type="radio" 
                  name="intended_action" 
                  value="donation" 
                  checked={formData.intended_action === 'donation'} 
                  onChange={handleChange} 
                  required
                />
                <label style={{ marginLeft: '0.5rem' }}>Donation</label>
              </div>
              <div>
                <input 
                  type="radio" 
                  name="intended_action" 
                  value="recycling" 
                  checked={formData.intended_action === 'recycling'} 
                  onChange={handleChange} 
                  required
                />
                <label style={{ marginLeft: '0.5rem' }}>Recycling</label>
              </div>
              {errors.intended_action && <div style={{ color: 'red' }}>{errors.intended_action}</div>}
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Item Name:</label>
              <input 
                type="text" 
                name="item_name" 
                value={formData.item_name} 
                onChange={handleChange} 
                style={inputStyle}
                required
              />
              {errors.item_name && <div style={{ color: 'red' }}>{errors.item_name}</div>}
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Category:</label>
              <select 
                name="category" 
                value={formData.category} 
                onChange={handleChange} 
                style={inputStyle}
                required
              >
                <option value="">Select</option>
                <option value="household">Household</option>
                <option value="clothing">Clothing</option>
                <option value="footwear">Footwear</option>
                <option value="toys">Toy</option>
                <option value="stationery">Stationary</option>
              </select>
              {errors.category && <div style={{ color: 'red' }}>{errors.category}</div>}
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Description:</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                style={{ ...inputStyle, height: '100px' }}
              ></textarea>
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Upload Picture(s):</label>
              <input 
                type="file" 
                name="images" 
                onChange={handleFileChange} 
                multiple 
                style={inputStyle}
                required
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {selectedImages.map((imgObj, index) => (
                  <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={imgObj.preview}
                      alt="Preview"
                      style={{ width: '100px', height: '100px', objectFit: 'cover', border: '1px solid #ccc' }}
                    />
                    <button
                      style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        background: 'red',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer'
                      }}
                      onClick={() => removeImage(index)}
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ ...stepNavigationStyle, flexWrap: 'wrap' }}>
              <button type="button" onClick={prevStep} style={buttonStyle}>Back</button>
              <button type="button" onClick={nextStep} style={buttonStyle}>Next</button>
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h3 style={headingStyle}>Step 4: Confirm Your Profile Details</h3>
            <div style={formGroupStyle}>
              <label style={labelStyle}>First Name:</label>
              <input 
                type="text" 
                name="new_first_name" 
                value={formData.profile.new_first_name} 
                onChange={handleChange} 
                style={inputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Last Name:</label>
              <input 
                type="text" 
                name="new_last_name" 
                value={formData.profile.new_last_name} 
                onChange={handleChange} 
                style={inputStyle}
              />
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Email:</label>
              <input 
                type="email" 
                name="new_email" 
                value={formData.profile.new_email} 
                onChange={handleChange} 
                style={inputStyle}
                required
              />
              {errors.new_email && <div style={{ color: 'red' }}>{errors.new_email}</div>}
            </div>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Phone:</label>
              <input 
                type="text" 
                name="phone" 
                value={formData.profile.phone} 
                onChange={handleChange} 
                style={inputStyle}
                required
              />
              {errors.phone && <div style={{ color: 'red' }}>{errors.phone}</div>}
            </div>
            <div style={stepNavigationStyle}>
              <button type="button" onClick={prevStep} style={buttonStyle}>Back</button>
              <button type="submit" style={buttonStyle}>Submit Donation</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} style={containerStyle}>
      {renderStep()}
    </form>
  );
};

export default DonationForm;