import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Game } from '../pages/Game';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import { act } from '@testing-library/react';


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
    currentPlayer: 'PLAYER_ONE' as const,
    winner: null,
    status: 'ongoing',
    error: null,
    moveCount: 0,
    handleCellClick: vi.fn(),
    handleResign: vi.fn(),
    handleTimeout: vi.fn(),
    resetGame: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('username', 'testuser'); // necesario para getTurnLabel()

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

  afterEach(() => {
    localStorage.clear();
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

  test('debe mostrar el turno del usuario cuando es PLAYER_ONE', () => {
    render(
      <MemoryRouter>
        <Game />
      </MemoryRouter>
    );

    expect(screen.getByText('Turno: testuser')).toBeInTheDocument();
    expect(screen.getByText('Rendirse')).toBeInTheDocument();
  });

  test('debe mostrar "Turno: Bot" cuando es el turno del bot en modo computer', () => {
    mockUseGame.mockReturnValue({ ...defaultGameState, currentPlayer: 'PLAYER_TWO' as const });

    render(
      <MemoryRouter>
        <Game />
      </MemoryRouter>
    );

    expect(screen.getByText('Turno: Bot')).toBeInTheDocument();
  });

  test('debe mostrar "Turno: Invitado" cuando es el turno del segundo jugador en modo human', () => {
    mockUseLocation.mockReturnValue({
      state: { mode: 'human', boardSize: 7 },
    });
    mockUseGame.mockReturnValue({ ...defaultGameState, currentPlayer: 'PLAYER_TWO' as const });

    render(
      <MemoryRouter>
        <Game />
      </MemoryRouter>
    );

    expect(screen.getByText('Turno: Invitado')).toBeInTheDocument();
  });

  test('debe mostrar TERMINADO cuando hay ganador', () => {
    mockUseGame.mockReturnValue({ ...defaultGameState, winner: 'PLAYER_ONE' as const });

    render(
      <MemoryRouter>
        <Game />
      </MemoryRouter>
    );

    expect(screen.getByText('TERMINADO')).toBeInTheDocument();
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

  describe('Lógica del Temporizador', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      
      mockUseLocation.mockReturnValue({
        state: { mode: 'computer', botId: 'random_bot', boardSize: 7, timer: 30 },
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('debe mostrar el temporizador y reducir el tiempo cada segundo', () => {
      // Necesitamos importar 'act' de '@testing-library/react' arriba en tu archivo
      
      render(
        <MemoryRouter>
          <Game />
        </MemoryRouter>
      );

      // Comprobamos que empieza en 30s
      expect(screen.getByText('⏳ 30s')).toBeInTheDocument();

      // Avanzamos el tiempo 1 segundo exacto
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Comprobamos que ha bajado a 29s
      expect(screen.getByText('⏳ 29s')).toBeInTheDocument();
    });

    test('debe llamar a handleTimeout EXACTAMENTE una vez cuando el tiempo llega a 0', () => {
    
      const mockHandleTimeout = vi.fn();
      mockUseGame.mockReturnValue({ ...defaultGameState, handleTimeout: mockHandleTimeout });

      render(
        <MemoryRouter>
          <Game />
        </MemoryRouter>
      );

      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(mockHandleTimeout).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(mockHandleTimeout).toHaveBeenCalledTimes(1);
    });
  });

});