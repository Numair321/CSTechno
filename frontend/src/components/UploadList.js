import React, { useState, useEffect } from 'react';
import API from '../api/axios';

export default function UploadList() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lists, setLists] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async (retry = false) => {
    try {
      setIsLoading(true);
      setError('');
      
      const res = await API.get('/lists', {
        timeout: 10000,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      setLists(Array.isArray(res.data) ? res.data : []);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching lists:', err);
      
      // Handle specific error cases
      if (err.response) {
        // Server responded with an error
        if (err.response.status === 401) {
          setError('Please log in again to continue');
          // Let the axios interceptor handle the redirect
        } else {
          setError(err.response.data?.message || 'Server error while fetching lists');
        }
      } else if (err.request) {
        // No response received
        if (retryCount < maxRetries && !retry) {
          setRetryCount(prev => prev + 1);
          console.log(`Retrying fetch... Attempt ${retryCount + 1} of ${maxRetries}`);
          setTimeout(() => fetchLists(true), 2000 * (retryCount + 1)); // Exponential backoff
          setError(`Connection issue. Retrying... (${retryCount + 1}/${maxRetries})`);
          return;
        } else {
          setError('Unable to connect to server. Please check your connection and refresh the page.');
        }
      } else {
        setError('Error fetching lists. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    // Quick pre-check to ensure server is reachable before uploading large files
    try {
      await API.get('/health', { timeout: 5000 });
    } catch (pingErr) {
      console.error('Health check failed:', pingErr);
      setError('Unable to connect to server. Please check your connection and refresh the page.');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError(`File size too large. Maximum size allowed is 10MB`);
      return;
    }

    // Validate file type
    const fileType = file.name.toLowerCase().split('.').pop();
    const allowedTypes = ['csv', 'xlsx', 'xls'];
    
    if (!allowedTypes.includes(fileType)) {
      setError(`Invalid file type. Please upload one of these formats: ${allowedTypes.join(', ')}`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const maxRetries = 3;
    let retryCount = 0;

    const uploadWithRetry = async () => {
      try {
        setError('');
        setMessage(`Uploading file... Attempt ${retryCount + 1}/${maxRetries}`);
        
        // Let the browser set the Content-Type (including boundary) for FormData
        const res = await API.post('/lists/upload', formData, {
          timeout: 60000, // Increased timeout for large files
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setMessage(`Uploading: ${percentCompleted}%`);
          },
          // Retry on network errors
          validateStatus: function (status) {
            return status >= 200 && status < 500;
          }
        });
        
        if (res.data.status === "error") {
          throw new Error(res.data.message || "Upload failed");
        }

        setMessage(res.data.message || 'File uploaded and distributed successfully');
        setFile(null); // Clear the file input
        await fetchLists(); // Refresh the lists after upload
        return true;
      } catch (err) {
        console.error('Upload attempt failed:', err);
        
        if (retryCount < maxRetries - 1 && (!err.response || err.response.status >= 500)) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
          return uploadWithRetry();
        }
        
        setMessage('');
        if (err.response) {
          // Server responded with error
          setError(err.response.data.message || err.response.data.details || 'Upload failed: Server error');
        } else if (err.request) {
          // Request was made but no response
          setError('Upload failed: No response from server. Please check your connection and try again.');
        } else {
          // Error in request setup
          setError(`Upload failed: ${err.message}`);
        }
        return false;
      }
    };

    try {
      await uploadWithRetry();
    } catch (err) {
      console.error('All upload attempts failed:', err);
      setError('Upload failed after multiple attempts. Please try again later.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f2f5',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        padding: '30px'
      }}>
        <h2 style={{
          color: '#1a73e8',
          marginBottom: '30px',
          fontSize: '28px',
          textAlign: 'center'
        }}>Upload & Distribute Lists</h2>
        
        <form onSubmit={handleUpload} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          padding: '30px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '2px dashed #ddd',
          marginBottom: '40px'
        }}>
          <div style={{
            width: '100%',
            textAlign: 'center'
          }}>
            <input 
              type="file" 
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setFile(e.target.files[0]);
                  setError(''); // Clear any previous errors
                  setMessage(''); // Clear any previous messages
                }
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '20px',
                marginBottom: '20px',
                cursor: 'pointer'
              }}
              // Reset the input when file is cleared
              key={file ? file.name : 'no-file'}
            />
            {file && (
              <p style={{
                margin: '10px 0',
                color: '#666',
                fontSize: '14px'
              }}>
                Selected file: {file.name}
              </p>
            )}
          </div>
          
          <button 
            type="submit"
            style={{
              backgroundColor: '#34a853',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '20px' }}>📤</span>
            Upload & Distribute
          </button>
        </form>
        
        {message && <p style={{
          color: '#34a853',
          textAlign: 'center',
          margin: '20px 0',
          padding: '10px',
          background: '#e6f4ea',
          borderRadius: '4px',
          fontSize: '14px'
        }}>{message}</p>}
        
        {error && <p style={{
          color: '#d32f2f',
          textAlign: 'center',
          margin: '20px 0',
          padding: '10px',
          background: '#fdeded',
          borderRadius: '4px',
          fontSize: '14px'
        }}>{error}</p>}

        <h3 style={{
          color: '#1a73e8',
          marginTop: '40px',
          marginBottom: '20px',
          fontSize: '20px'
        }}>Distributed Lists</h3>

        <div style={{
          display: 'grid',
          gap: '20px'
        }}>
          {isLoading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              background: '#f8f9fa',
              borderRadius: '8px',
              color: '#666'
            }}>
              Loading lists...
            </div>
          ) : lists.length > 0 ? lists.map((list) => (
            <div 
              key={list._id}
              style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
            >
              <h4 style={{
                color: '#1a73e8',
                marginBottom: '15px',
                fontSize: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Agent: {list.agentId?.name} ({list.agentId?.email})</span>
                <span style={{
                  backgroundColor: '#e3f2fd',
                  color: '#1a73e8',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  {list.data.length} leads
                </span>
              </h4>
              <div style={{
                display: 'grid',
                gap: '10px'
              }}>
                {list.data.length > 0 ? (
                  list.data.map((item, index) => (
                    <div 
                      key={index}
                      style={{
                        background: 'white',
                        padding: '15px',
                        borderRadius: '4px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '10px',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontWeight: '500' }}>
                        {item.firstName || 'N/A'}
                      </span>
                      <span style={{ color: '#666' }}>
                        {item.phone || 'N/A'}
                      </span>
                      <span style={{ color: '#666' }}>
                        {item.notes || 'No notes'}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                    No leads assigned
                  </p>
                )}
              </div>
            </div>
          )) : !error ? (
            <p style={{ 
              textAlign: 'center', 
              color: '#666', 
              padding: '40px',
              background: '#f8f9fa',
              borderRadius: '8px',
              marginTop: '20px'
            }}>
              No distributions yet. Upload a file to distribute leads among agents.
            </p>
          ) : null}
          
          {error && (
            <div style={{
              padding: '20px',
              background: '#fdeded',
              border: '1px solid #fccfcf',
              borderRadius: '8px',
              color: '#d32f2f',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <div>
                <p style={{ margin: '0', fontWeight: '500' }}>Error</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>{error}</p>
                <button
                  onClick={() => fetchLists()}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    background: '#d32f2f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
