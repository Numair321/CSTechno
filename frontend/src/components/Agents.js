import React, { useState, useEffect } from 'react';
import API from '../api/axios';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [addingAgent, setAddingAgent] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await API.get('/agents');
      setAgents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError(err.response?.data?.message || 'Failed to fetch agents');
      setAgents([]); // Reset to empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      setAddingAgent(true);
      setError('');
        
      // Validate form DATA 
      if (!form.name || !form.email || !form.mobile || !form.password) {
        throw new Error('Please fill in all required fields');
      }

      const response = await API.post('/agents', form);
      
      if (response.data.agent) {
          // Reset form and fetch updated list
          setForm({ name: '', email: '', mobile: '', password: '' });
          await fetchAgents();
        
      } else {
        throw new Error(response.data.message || 'Failed to add agent');
      }
    } catch (err) {
        console.error('Error adding agent:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to add agent. Please check your connection and try again.'
      );
    } finally {
      setAddingAgent(false);
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
        }}>Manage Agents</h2>

        <form onSubmit={handleAdd} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <input 
            placeholder="Name" 
            value={form.name} 
            onChange={e => setForm({...form, name: e.target.value})} 
            required 
            disabled={addingAgent}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
          <input 
            placeholder="Email" 
            type="email"
            value={form.email} 
            onChange={e => setForm({...form, email: e.target.value})} 
            required 
            disabled={addingAgent}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
          <input 
            placeholder="Mobile" 
            value={form.mobile} 
            onChange={e => setForm({...form, mobile: e.target.value})} 
            required 
            disabled={addingAgent}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
          <input 
            placeholder="Password" 
            type="password" 
            value={form.password} 
            onChange={e => setForm({...form, password: e.target.value})} 
            required 
            disabled={addingAgent}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          />
          <button 
            type="submit"
            disabled={addingAgent}
            style={{
              backgroundColor: '#1a73e8',
              color: 'white',
              padding: '12px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: addingAgent ? 'not-allowed' : 'pointer',
              opacity: addingAgent ? 0.7 : 1,
              transition: 'all 0.3s',
              gridColumn: '1 / -1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {addingAgent ? 'Adding Agent...' : 'Add Agent'}
          </button>
        </form>

        <div>
          <h3 style={{
            color: '#1a73e8',
            marginBottom: '20px',
            fontSize: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Agent List</span>
            {isLoading && (
              <span style={{ 
                fontSize: '14px',
                color: '#666'
              }}>Loading...</span>
            )}
          </h3>

          {error ? (
            <div style={{
              padding: '20px',
              background: '#fdeded',
              border: '1px solid #fccfcf',
              borderRadius: '8px',
              color: '#d32f2f',
              marginBottom: '20px'
            }}>
              <p style={{ margin: '0 0 10px 0' }}>{error}</p>
              <button
                onClick={fetchAgents}
                style={{
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
          ) : isLoading ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#666',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              Loading agents...
            </div>
          ) : agents.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#666',
              background: '#f8f9fa',
              borderRadius: '8px'
            }}>
              No agents found. Add your first agent using the form above.
            </div>
          ) : (
            <div style={{
              background: '#fff',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              {agents.map(agent => (
                <div 
                  key={agent._id}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: '500' }}>{agent.name}</span>
                  <span style={{ color: '#666' }}>{agent.email}</span>
                  <span style={{ color: '#666' }}>{agent.mobile}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}