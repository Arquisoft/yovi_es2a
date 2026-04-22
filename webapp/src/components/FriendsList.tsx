import React, { useEffect, useState } from 'react';
import { getFriends, removeFriend, type UserPublicData } from '../services/gameService';
import UserProfile from './UserProfile';

interface FriendsListProps {
    onFriendRemoved?: () => void;
}

const FriendsList: React.FC<FriendsListProps> = ({ onFriendRemoved }) => {
    const [friends, setFriends] = useState<UserPublicData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const currentUser = localStorage.getItem('username');

    useEffect(() => {
        if (!currentUser) {
            setError('No estás autenticado');
            setLoading(false);
            return;
        }

        loadFriends();
    }, [currentUser]);

    const loadFriends = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await getFriends(currentUser!);
            setFriends(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al cargar amigos');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFriend = async (friendUsername: string) => {
        try {
            await removeFriend(friendUsername);
            setFriends(friends.filter(f => f.username !== friendUsername));
            if (onFriendRemoved) onFriendRemoved();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al remover amigo');
        }
    };

    if (!currentUser) {
        return <p className="loading-text">Debes iniciar sesión para ver tu lista de amigos.</p>;
    }

    if (loading) {
        return <p className="loading-text">Cargando amigos...</p>;
    }

    if (error) {
        return <p className="error-text">Error: {error}</p>;
    }

    if (friends.length === 0) {
        return <p className="friends-empty">Todavía no tienes amigos. ¡Busca y agrega algunos!</p>;
    }

    return (
        <div className="friends-list">
            {friends.map((friend) => (
                <UserProfile
                    key={friend.username}
                    user={friend}
                    action="remover"
                    onAction={() => handleRemoveFriend(friend.username)}
                />
            ))}
        </div>
    );
};

export default FriendsList;
