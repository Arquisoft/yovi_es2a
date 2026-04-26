import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import RankingHelp from '../pages/RankingHelp'; 

describe('RankingHelp Component', () => {
    
    test('1. Renderiza solo el botón disparador inicialmente (modal cerrado)', () => {
        render(<RankingHelp />);
        
        const triggerButton = screen.getByRole('button', { name: /Ayuda sobre la puntuación/i });
        expect(triggerButton).toBeInTheDocument();
        
        expect(screen.queryByText('¿Cómo se calcula la Puntuación?')).not.toBeInTheDocument();
    });

    test('2. Abre el modal al hacer clic en el botón del interrogante', async () => {
        const user = userEvent.setup();
        render(<RankingHelp />);
        
        const triggerButton = screen.getByRole('button', { name: /Ayuda sobre la puntuación/i });
        await user.click(triggerButton);
        
        expect(screen.getByText('¿Cómo se calcula la Puntuación?')).toBeInTheDocument();
        expect(screen.getByText(/Dificultad del Rival/i)).toBeInTheDocument();
    });

    test('3. Cierra el modal al hacer clic en el botón de la ✖', async () => {
        const user = userEvent.setup();
        render(<RankingHelp />);
        
        await user.click(screen.getByRole('button', { name: /Ayuda sobre la puntuación/i }));
        
        const closeButtonX = screen.getByText('✖');
        await user.click(closeButtonX);
        
        expect(screen.queryByText('¿Cómo se calcula la Puntuación?')).not.toBeInTheDocument();
    });

    test('4. Cierra el modal al hacer clic en el botón "Entendido"', async () => {
        const user = userEvent.setup();
        render(<RankingHelp />);
        
        await user.click(screen.getByRole('button', { name: /Ayuda sobre la puntuación/i }));
        
        const entendidoButton = screen.getByRole('button', { name: /Entendido/i });
        await user.click(entendidoButton);
        
        expect(screen.queryByText('¿Cómo se calcula la Puntuación?')).not.toBeInTheDocument();
    });

    test('5. Cierra el modal al hacer clic en el fondo oscuro (overlay)', async () => {
        const user = userEvent.setup();
        const { container } = render(<RankingHelp />);
        
        await user.click(screen.getByRole('button', { name: /Ayuda sobre la puntuación/i }));
        
        const overlay = container.querySelector('.ranking-help-overlay');
        expect(overlay).not.toBeNull();
        
        if (overlay) await user.click(overlay);
        
        expect(screen.queryByText('¿Cómo se calcula la Puntuación?')).not.toBeInTheDocument();
    });

    test('6. NO cierra el modal si se hace clic dentro del contenido (stopPropagation)', async () => {
        const user = userEvent.setup();
        const { container } = render(<RankingHelp />);
        
        await user.click(screen.getByRole('button', { name: /Ayuda sobre la puntuación/i }));
        
        const modalContent = container.querySelector('.ranking-help-modal');
        expect(modalContent).not.toBeNull();
        
        if (modalContent) await user.click(modalContent);
        
        expect(screen.getByText('¿Cómo se calcula la Puntuación?')).toBeInTheDocument();
    });
});