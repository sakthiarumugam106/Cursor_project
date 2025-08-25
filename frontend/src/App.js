import React from 'react';

const App = () => {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ color: '#2196F3', marginBottom: '20px' }}>
        🎉 React App is Working!
      </h1>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '500px'
      }}>
        <h2>Test Information:</h2>
        <p><strong>React Version:</strong> {React.version}</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        <p><strong>API URL:</strong> {process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}</p>
        <p><strong>Current Time:</strong> {new Date().toLocaleString()}</p>
        
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px' }}>
          <h3>Next Steps:</h3>
          <p>If you can see this, React is working correctly!</p>
          <p>The issue was likely with the complex routing and context setup.</p>
        </div>
      </div>
    </div>
  );
};

export default App;