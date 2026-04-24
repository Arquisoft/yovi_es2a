import React, { useState } from 'react';
import { searchUsers, addFriend, type UserPublicData } from '../services/gameService';
import UserProfile from './UserProfile';

interface SearchUsersProps {
    onUserAdded?: () => void;
}

const SearchUsers: React.FC<SearchUsersProps> = ({ onUserAdded }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserPublicData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);
    const currentUser = localStorage.getItem('username');

    const handleSearch = async () => {
        if (!query.trim()) {
            setError('Ingresa un nombre de usuario');
            return;
        }

        setLoading(true);
        setError(null);
        setSearched(true);

        try {
            const users = await searchUsers(query.trim());
            
            // Filtrar el usuario actual de los resultados
            const filtered = users.filter(u => u.username !== currentUser);
            setResults(filtered);
            
            if (filtered.length === 0) {
                setError('No se encontraron usuarios con ese nombre');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error en la búsqueda');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFriend = async (friendUsername: string) => {
        try {
            await addFriend(friendUsername);
            setResults(results.filter(u => u.username !== friendUsername));
            if (onUserAdded) onUserAdded();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al agregar amigo');
        }
    };

    return (
        <div className="search-users-container">
            <div className="search-input-group">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Buscar usuario por nombre..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button className="search-button" onClick={handleSearch} disabled={loading}>
                    {loading ? 'Buscando...' : 'Buscar'}
                </button>
            </div>

            {error && <p className="search-status error">{error}</p>}

            {loading && <p className="search-status">Buscando usuarios...</p>}

            {!loading && searched && results.length === 0 && !error && (
                <p className="search-status">Sin usuarios para mostrar</p>
            )}

            {!loading && results.length > 0 && (
                <div className="search-results">
                    {results.map((user) => (
                        <UserProfile
                            key={user.username}
                            user={user}
                            action="agregar"
                            onAction={() => handleAddFriend(user.username)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchUsers;
