import React, { useEffect, useState } from 'react';
import { getGroups, getMyGroups, joinGroup, createGroup, type GroupData } from '../services/gameService';

interface BrowseGroupsProps {
    onGroupJoined?: () => void;
}

const BrowseGroups: React.FC<BrowseGroupsProps> = ({ onGroupJoined }) => {
    const [groups, setGroups] = useState<GroupData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [creatingGroup, setCreatingGroup] = useState(false);
    const [myGroups, setMyGroups] = useState<Set<string>>(new Set());

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
            const [allGroups, myGroupMemberships] = await Promise.all([
                getGroups(),
                getMyGroups()
            ]);
            setGroups(allGroups);
            
            // Marcar grupos a los que el usuario ya pertenece
            const myGroupIds = new Set(myGroupMemberships.map(g => g._id as string));
            setMyGroups(myGroupIds);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al cargar grupos');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!formData.name.trim()) {
            setError('El nombre del grupo es requerido');
            return;
        }

        setCreatingGroup(true);
        setError(null);

        try {
            await createGroup(formData.name, formData.description);
            setFormData({ name: '', description: '' });
            setShowCreateForm(false);
            loadGroups(); // Refresh to get updated membership status
            if (onGroupJoined) onGroupJoined();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al crear grupo');
        } finally {
            setCreatingGroup(false);
        }
    };

    const handleJoinGroup = async (groupId: string) => {
        try {
            await joinGroup(groupId);
            setMyGroups(new Set(myGroups).add(groupId));
            loadGroups(); // Refresh to get updated membership status
            if (onGroupJoined) onGroupJoined();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Error al unirse al grupo');
        }
    };

    if (!currentUser) {
        return <p className="loading-text">Debes iniciar sesión para ver los grupos.</p>;
    }

    if (loading && groups.length === 0) {
        return <p className="loading-text">Cargando grupos...</p>;
    }

    return (
        <div>
            {error && <p className="error-text">{error}</p>}

            <div className="create-group-container">
                {!showCreateForm ? (
                    <button
                        className="group-action"
                        onClick={() => setShowCreateForm(true)}
                        style={{ width: '100%', padding: '1rem' }}
                    >
                        ➕ Crear nuevo grupo
                    </button>
                ) : (
                    <div className="create-group-form">
                        <div className="form-group">
                            <label className="form-label">Nombre del grupo</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Ej: Jugadores Avanzados"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Descripción (opcional)</label>
                            <textarea
                                className="form-textarea"
                                placeholder="Describe el propósito del grupo..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="form-buttons">
                            <button
                                className="form-submit"
                                onClick={handleCreateGroup}
                                disabled={creatingGroup}
                            >
                                {creatingGroup ? 'Creando...' : '✅ Crear'}
                            </button>
                            <button
                                className="form-cancel"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setFormData({ name: '', description: '' });
                                }}
                            >
                                ❌ Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {groups.length === 0 ? (
                <p className="search-status">No hay grupos disponibles todavía.</p>
            ) : (
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
                                </div>
                            </div>
                            <button
                                className={`group-action ${myGroups.has(group._id) ? 'leave' : ''}`}
                                onClick={() => handleJoinGroup(group._id)}
                                disabled={myGroups.has(group._id)}
                            >
                                {myGroups.has(group._id) ? '✓ Miembro' : '➕ Unirse'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BrowseGroups;
