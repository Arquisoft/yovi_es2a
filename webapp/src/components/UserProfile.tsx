import React from 'react';
import { type UserPublicData } from '../services/gameService';

interface UserProfileProps {
    user: UserPublicData;
    action?: 'agregar' | 'remover' | 'none';
    actionLabel?: string;
    onAction?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
    user,
    action = 'none',
    actionLabel,
    onAction
}) => {
    const getActionLabel = () => {
        if (actionLabel) return actionLabel;
        switch (action) {
            case 'agregar':
                return '➕ Agregar amigo';
            case 'remover':
                return '➖ Remover amigo';
            default:
                return '';
        }
    };

    return (
        <div className="user-profile-card">
            <div className="user-profile-info">
                <div className="user-profile-name">{user.username}</div>
                <div className="user-profile-stats">
                    <div className="user-profile-stat">
                        <span>📊</span>
                        <span>{user.stats.total} partidas</span>
                    </div>
                    <div className="user-profile-stat">
                        <span>✅</span>
                        <span>{user.stats.wins} victorias</span>
                    </div>
                    <div className="user-profile-stat">
                        <span>📈</span>
                        <span>{user.stats.winRate}% win rate</span>
                    </div>
                </div>
            </div>
            {action !== 'none' && onAction && (
                <button
                    className={`user-profile-action ${action === 'remover' ? 'remove' : ''}`}
                    onClick={onAction}
                >
                    {getActionLabel()}
                </button>
            )}
        </div>
    );
};

export default UserProfile;
