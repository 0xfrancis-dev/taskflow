import '../css/app.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import App from './App';

class Boundary extends React.Component {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(e) { console.error(e); }
    render() {
        if (!this.state.failed) return this.props.children;
        return (
            <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800 }}>Something went wrong</h1>
                    <p style={{ margin: '8px 0 20px', color: '#6A6190' }}>Please try again.</p>
                    <button onClick={() => window.location.reload()} style={{ background: '#6B4CFF', color: '#fff', padding: '12px 28px', borderRadius: 999, fontWeight: 600 }}>Try again</button>
                </div>
            </div>
        );
    }
}

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <AppProvider>
                <Boundary>
                    <App />
                </Boundary>
            </AppProvider>
        </BrowserRouter>
    </React.StrictMode>
);