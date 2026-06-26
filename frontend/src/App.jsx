import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import CustomerPage from './pages/CustomerPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <NavBar user={user} onLogout={() => setUser(null)} />

        {!user ? (
          <LoginPage onLogin={setUser} />
        ) : (
          <Routes>
            {user.role === 'user' && (
              <Route path="/" element={<CustomerPage />} />
            )}
            {user.role === 'admin' && (
              <Route path="/admin" element={<AdminPage />} />
            )}
            <Route
              path="*"
              element={<Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />}
            />
          </Routes>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;
