import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
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
        }}>Dashboard</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          padding: '20px'
        }}>
          <Link to="/agents" style={{
            backgroundColor: '#1a73e8',
            color: 'white',
            padding: '30px',
            borderRadius: '8px',
            textDecoration: 'none',
            textAlign: 'center',
            fontSize: '18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '150px',
            transition: 'transform 0.3s, box-shadow 0.3s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            hover: {
              transform: 'translateY(-5px)',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }
          }}>
            <span style={{ fontSize: '24px', marginBottom: '10px' }}>👥</span>
            Manage Agents
          </Link>
          <Link to="/upload" style={{
            backgroundColor: '#34a853',
            color: 'white',
            padding: '30px',
            borderRadius: '8px',
            textDecoration: 'none',
            textAlign: 'center',
            fontSize: '18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '150px',
            transition: 'transform 0.3s, box-shadow 0.3s',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            hover: {
              transform: 'translateY(-5px)',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
            }
          }}>
            <span style={{ fontSize: '24px', marginBottom: '10px' }}>📊</span>
            Upload & Distribute Lists
          </Link>
        </div>
      </div>
    </div>
  );
}
