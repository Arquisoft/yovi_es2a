import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthComprobation } from '../components/AuthComprobation';
import Navbar from '../components/Navbar';
import SearchUsers from '../components/SearchUsers';
import FriendsList from '../components/FriendsList';
import GroupsList from '../components/GroupsList';
import BrowseGroups from '../components/BrowseGroups';
import '../styles/UserNetwork.css';

type NetworkTab = 'buscar' | 'amigos' | 'misgrupos' | 'grupos';

export default function UserNetwork(): JSX.Element {
    const navigate = useNavigate();
    useAuthComprobation();
    const [activeTab, setActiveTab] = useState<NetworkTab>('buscar');
    const [refreshKey, setRefreshKey] = useState(0);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="usernetwork-container">
            <Navbar />
            <div className="usernetwork-card">
                <div className="usernetwork-header">
                    <button
                        className="usernetwork-back-btn"
                        onClick={() => navigate('/menu')}
                        title="Volver al menú"
                    >
                        ← Menú
                    </button>
                    <h1 className="usernetwork-title">👥 Mi red de usuarios</h1>
                </div>

                <div className="usernetwork-tabs">
                    <button
                        className={`usernetwork-tab ${activeTab === 'buscar' ? 'active' : ''}`}
                        onClick={() => setActiveTab('buscar')}
                    >
                        🔍 Buscar usuarios
                    </button>
                    <button
                        className={`usernetwork-tab ${activeTab === 'amigos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('amigos')}
                    >
                        👫 Mis amigos
                    </button>
                    <button
                        className={`usernetwork-tab ${activeTab === 'misgrupos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('misgrupos')}
                    >
                        📁 Mis grupos
                    </button>
                    <button
                        className={`usernetwork-tab ${activeTab === 'grupos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('grupos')}
                    >
                        🌐 Explorar grupos
                    </button>
                </div>

                <div className="usernetwork-content" key={refreshKey}>
                    {activeTab === 'buscar' && (
                        <SearchUsers onUserAdded={handleRefresh} />
                    )}
                    {activeTab === 'amigos' && (
                        <FriendsList onFriendRemoved={handleRefresh} />
                    )}
                    {activeTab === 'misgrupos' && (
                        <GroupsList onGroupLeft={handleRefresh} />
                    )}
                    {activeTab === 'grupos' && (
                        <BrowseGroups onGroupJoined={handleRefresh} />
                    )}
                </div>
            </div>
        </div>
    );
}
