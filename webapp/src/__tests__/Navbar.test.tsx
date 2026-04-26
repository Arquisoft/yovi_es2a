import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Navbar from '../components/Navbar'; 

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('../components/AuthComprobation', () => ({ 
    getLoggedUser: vi.fn(() => 'UsuarioPrueba'),
}));

describe('Componente Navbar', () => {
    
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('renderiza correctamente el logo, el título y el botón del usuario', () => {
        render(<Navbar />);
        
        expect(screen.getByText('YOVI_ES2A')).toBeInTheDocument();
        expect(screen.getByAltText('Logo YOVI')).toBeInTheDocument();
        
        expect(screen.getByRole('button', { name: /UsuarioPrueba/i })).toBeInTheDocument();
    });

    it('navega al /menu principal al hacer clic en la zona del logo', () => {
        render(<Navbar />);
        
        const logoContainer = screen.getByText('YOVI_ES2A').parentElement;
        fireEvent.click(logoContainer!); 
        
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/menu');
    });

    it('despliega y oculta el menú desplegable al hacer clic en el botón del usuario', () => {
        render(<Navbar />);
        const userButton = screen.getByRole('button', { name: /UsuarioPrueba/i });

        expect(screen.queryByText('Cerrar sesión')).not.toBeInTheDocument();

        fireEvent.click(userButton);
        expect(screen.getByText('👥 Mi red de usuarios')).toBeInTheDocument();
        expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();

        fireEvent.click(userButton);
        expect(screen.queryByText('Cerrar sesión')).not.toBeInTheDocument();
    });

    it('navega a /red al hacer clic en "Mi red de usuarios"', () => {
        render(<Navbar />);
        
        fireEvent.click(screen.getByRole('button', { name: /UsuarioPrueba/i }));
        fireEvent.click(screen.getByText('👥 Mi red de usuarios'));

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/red');
    });

    it('borra el usuario del localStorage y navega al inicio (/) al cerrar sesión', () => {
        localStorage.setItem('username', 'UsuarioPrueba');
        render(<Navbar />);
        
        fireEvent.click(screen.getByRole('button', { name: /UsuarioPrueba/i }));
        fireEvent.click(screen.getByText('Cerrar sesión'));

        expect(localStorage.getItem('username')).toBeNull();
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});