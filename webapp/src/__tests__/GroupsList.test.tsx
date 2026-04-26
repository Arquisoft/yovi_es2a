import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import GroupsList from '../components/GroupsList'; 
import { getMyGroups, leaveGroup } from '../services/gameService';

vi.mock('../services/gameService', () => ({
    getMyGroups: vi.fn(),
    leaveGroup: vi.fn(),
}));

describe('Componente GroupsList', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('username', 'MiUsuario');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('muestra un mensaje si el usuario no está autenticado', () => {
        localStorage.removeItem('username');
        render(<GroupsList />);
        
        expect(screen.getByText('Debes iniciar sesión para ver tu lista de grupos.')).toBeInTheDocument();
        expect(getMyGroups).not.toHaveBeenCalled();
    });

    it('muestra "Cargando..." y luego los grupos si la API responde correctamente', async () => {
        const mockGroups = [
            { _id: 'g1', name: 'Grupo Alfa', description: 'El mejor grupo', createdBy: 'Admin1', role: 'member' },
            { _id: 'g2', name: 'Grupo Beta', description: '', createdBy: 'Admin2', role: 'admin' }
        ];
        (getMyGroups as any).mockResolvedValue(mockGroups);

        render(<GroupsList />);

        expect(screen.getByText('Cargando grupos...')).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByText('Cargando grupos...')).not.toBeInTheDocument();
        });

        expect(screen.getByText('Grupo Alfa')).toBeInTheDocument();
        expect(screen.getByText('El mejor grupo')).toBeInTheDocument();
        expect(screen.getByText('👤 Creado por Admin1')).toBeInTheDocument();
        
        expect(screen.getByText('Grupo Beta')).toBeInTheDocument();
        expect(screen.getByText('🏷️ Rol: admin')).toBeInTheDocument();
    });

    it('muestra un mensaje cuando el usuario no pertenece a ningún grupo', async () => {
        (getMyGroups as any).mockResolvedValue([]);

        render(<GroupsList />);

        await waitFor(() => {
            expect(screen.getByText(/Todavía no eres miembro de ningún grupo/i)).toBeInTheDocument();
        });
    });

    it('muestra un mensaje de error si la carga de grupos falla', async () => {
        (getMyGroups as any).mockRejectedValue(new Error('Backend caído'));

        render(<GroupsList />);

        await waitFor(() => {
            expect(screen.getByText('Error: Backend caído')).toBeInTheDocument();
        });
    });

    it('no hace nada si el usuario cancela la confirmación al salir de un grupo', async () => {
        const mockGroups = [{ _id: 'g1', name: 'Grupo Alfa', createdBy: 'Admin1', role: 'member' }];
        (getMyGroups as any).mockResolvedValue(mockGroups);
        
        const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => false);

        render(<GroupsList />);

        await waitFor(() => expect(screen.getByText('Grupo Alfa')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Salir del grupo' }));

        expect(confirmSpy).toHaveBeenCalledWith('¿Estás seguro de que quieres salir de este grupo?');
        expect(leaveGroup).not.toHaveBeenCalled(); 
    });

    it('sale del grupo y recarga la lista si el usuario acepta la confirmación', async () => {
        const mockGroups = [{ _id: 'g1', name: 'Grupo Alfa', createdBy: 'Admin1', role: 'member' }];
        (getMyGroups as any).mockResolvedValue(mockGroups);
        (leaveGroup as any).mockResolvedValue({});
        
        const mockOnGroupLeft = vi.fn();
        
        vi.spyOn(window, 'confirm').mockImplementation(() => true);

        render(<GroupsList onGroupLeft={mockOnGroupLeft} />);

        await waitFor(() => expect(screen.getByText('Grupo Alfa')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Salir del grupo' }));

        await waitFor(() => {
            expect(leaveGroup).toHaveBeenCalledWith('g1');
            expect(mockOnGroupLeft).toHaveBeenCalledTimes(1);
            expect(getMyGroups).toHaveBeenCalledTimes(2);
        });
    });

    it('muestra un mensaje de error si falla la acción de salir de un grupo', async () => {
        const mockGroups = [{ _id: 'g1', name: 'Grupo Alfa', createdBy: 'Admin1', role: 'member' }];
        (getMyGroups as any).mockResolvedValue(mockGroups);
        (leaveGroup as any).mockRejectedValue(new Error('Fallo al salir'));
        
        vi.spyOn(window, 'confirm').mockImplementation(() => true);

        render(<GroupsList />);

        await waitFor(() => expect(screen.getByText('Grupo Alfa')).toBeInTheDocument());

        fireEvent.click(screen.getByRole('button', { name: 'Salir del grupo' }));

        await waitFor(() => {
            expect(screen.getByText('Error: Fallo al salir')).toBeInTheDocument();
        });
    });
});