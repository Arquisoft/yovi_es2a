import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLoggedUser } from './AuthComprobation';
import { FaUserCircle } from 'react-icons/fa';
import './Navbar.css';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const user = getLoggedUser();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('username');
        navigate('/');
    };

    const handleNetworkClick = () => {
        navigate('/red');
        setShowDropdown(false);
    };

    return (
        <nav className="navbar">
            <div className="navbar-left" onClick={() => navigate('/menu')}>
                <img src="/favicon.ico" alt="Logo YOVI" className="navbar-logo" />
                <span className="navbar-brand">YOVI_ES2A</span>
            </div>
            <div className="navbar-right">
                <button className="user-button" onClick={() => setShowDropdown(!showDropdown)}>
                    <FaUserCircle size={20} />
                    {user}
                </button>
                {showDropdown && (
                    <div className="dropdown-menu">
                        <button onClick={handleNetworkClick}>👥 Mi red de usuarios</button>
                        <button onClick={handleLogout}>Cerrar sesión</button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;