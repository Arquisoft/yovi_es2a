import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { Game } from '../pages/Game';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';

const { 
  mockUseGame, 
  mockUseAuthComprobation, 
  mockGetLoggedUser, 
  mockUseNavigate, 
  mockUseLocation 
} = vi.hoisted(() => ({
  mockUseGame: vi.fn(),
  mockUseAuthComprobation: vi.fn(),
  mockGetLoggedUser: vi.fn(),
  mockUseNavigate: vi.fn(),
  mockUseLocation: vi.fn(),
}));

vi.mock('../hooks/useGame', () => ({
  useGame: mockUseGame,
}));

vi.mock('../components/AuthComprobation', () => ({
  useAuthComprobation: mockUseAuthComprobation,
  getLoggedUser: mockGetLoggedUser,
}));

vi.mock('react-icons/fa', () => ({
  FaUserCircle: () => null,
}));

vi.mock('../components/Navbar', () => ({
  default: () => <nav data-testid="navbar" />,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockUseNavigate, 
    useLocation: mockUseLocation,
  };
});

describe('Game Component', () => {
  const generateMockCells = (size: number) => {
    return Array.from({ length: size * size }, (_, i) => ({
      x: i % size,
      y: Math.floor(i / size),
      player: null
    }));
  };

  const defaultGameState = {
    cells: generateMockCells(7),
    currentPlayer: 1,
    winner: null,
    status: 'ongoing',
    error: null,
    handleCellClick: vi.fn(),
    handleResign: vi.fn(),
    resetGame: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseAuthComprobation.mockReturnValue(undefined);
    mockGetLoggedUser.mockReturnValue('testuser');
    mockUseLocation.mockReturnValue({
      state: {
        mode: 'computer',
        botId: 'random_bot',
        boardSize: 7,
      },
    });
    mockUseGame.mockReturnValue(defaultGameState);
  });

  test('debe mostrar el estado de carga', () => {
    mockUseGame.mockReturnValue({ ...defaultGameState, status: 'loading' });

    render(
      <MemoryRouter>
        <Game />
      </MemoryRouter>
    );

    expect(screen.getByText('Cargando partida...')).toBeInTheDocument();
  });

  test('debe mostrar el estado de una partida en curso', () => {
    render(
      <MemoryRouter>
        <Game />
      </MemoryRouter>
    );

    expect(screen.getByText('Turno: 1')).toBeInTheDocument();
    expect(screen.getByText('Rendirse')).toBeInTheDocument();
    expect(screen.getByText(/Jugador Loggeado: testuser/i)).toBeInTheDocument();
  });

  test('debe llamar a handleResign cuando se hace clic en el botón de rendirse', () => {
    const mockHandleResign = vi.fn();
    mockUseGame.mockReturnValue({ ...defaultGameState, handleResign: mockHandleResign });

    render(
      <MemoryRouter>
        <Game />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Rendirse'));
    expect(mockHandleResign).toHaveBeenCalled();
  });

  test('debe deshabilitar el botón de rendirse cuando la partida no está en curso', () => {
    mockUseGame.mockReturnValue({ ...defaultGameState, status: 'finished' });

    render(
      <MemoryRouter>
        <Game />
      </MemoryRouter>
    );

    expect(screen.getByText('Rendirse')).toBeDisabled();
  });

  test('debe usar valores por defecto cuando el estado de la ubicación esté ausente', () => {
    mockUseLocation.mockReturnValue({ state: null });

    render(
      <MemoryRouter>
        <Game />
      </MemoryRouter>
    );

    expect(mockUseGame).toHaveBeenCalledWith(expect.objectContaining({
      size: 7,
      mode: 'computer'
    }));
  });
});