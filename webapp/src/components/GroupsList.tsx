import React, { useEffect, useState } from 'react';
import { getMyGroups, leaveGroup, type GroupData } from '../services/gameService';

interface GroupsListProps {
    onGroupLeft?: () => void;
}

const GroupsList: React.FC<GroupsListProps> = ({ onGroupLeft }) => {
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const currentUser = localStorage.getItem('username');

    useEffect(() => {
        if (!currentUser) {
            setError('No estás autenticado');
            setLoading(false);
            return;
        }

        loadGroups();
    }, [currentUser]);

    const loadGroups = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await getMyGroups();
            setGroups(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al cargar tus grupos');
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveGroup = async (groupId: string) => {
        if (!confirm('¿Estás seguro de que quieres salir de este grupo?')) return;

        try {
            await leaveGroup(groupId);
            setGroups(groups.filter(g => g._id !== groupId));
            if (onGroupLeft) onGroupLeft();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al salir del grupo');
        }
    };

    if (!currentUser) {
        return <p className="loading-text">Debes iniciar sesión para ver tu lista de grupos.</p>;
    }

    if (loading) {
        return <p className="loading-text">Cargando grupos...</p>;
    }

    if (error) {
        return <p className="error-text">Error: {error}</p>;
    }

    if (groups.length === 0) {
        return <p className="groups-empty" style={{ textAlign: 'center', color: '#a1a1a1', padding: '2rem 0' }}>
            Todavía no eres miembro de ningún grupo. ¡Explora y únete a algunos!
        </p>;
    }

    return (
        <div className="groups-list">
            {groups.map((group) => (
                <div key={group._id} className="group-card">
                    <div className="group-info">
                        <div className="group-name">{group.name}</div>
                        {group.description && (
                            <div className="group-description">{group.description}</div>
                        )}
                        <div className="group-meta">
                            <span>👤 Creado por {group.createdBy}</span>
                            <span>🏷️ Rol: {group.role}</span>
                        </div>
                    </div>
                    <button
                        className="group-action leave"
                        onClick={() => handleLeaveGroup(group._id)}
                    >
                        Salir del grupo
                    </button>
                </div>
            ))}
        </div>
    );
};

export default GroupsList;
