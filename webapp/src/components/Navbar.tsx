import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLoggedUser } from './AuthComprobation';
import './Navbar.css';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const user = getLoggedUser();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('username');
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="navbar-left">
                YOVI_ES2A
            </div>
            <div className="navbar-right">
                <button className="user-button" onClick={() => setShowDropdown(!showDropdown)}>
                    {user}
                </button>
                {showDropdown && (
                    <div className="dropdown-menu">
                        <button onClick={handleLogout}>Cerrar sesión</button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;