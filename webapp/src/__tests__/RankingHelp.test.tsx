import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Ajusta la ruta dependiendo de dónde guardes el archivo de test
import RankingHelp from '../pages/RankingHelp'; 

describe('RankingHelp Component', () => {
    
    test('1. Renderiza solo el botón disparador inicialmente (modal cerrado)', () => {
        render(<RankingHelp />);
        
        // El botón con el interrogante debe estar
        const triggerButton = screen.getByRole('button', { name: /Ayuda sobre la puntuación/i });
        expect(triggerButton).toBeInTheDocument();
        
        // El título del modal NO debe estar en el documento
        expect(screen.queryByText('¿Cómo se calcula la Puntuación?')).not.toBeInTheDocument();
    });

    test('2. Abre el modal al hacer clic en el botón del interrogante', async () => {
        const user = userEvent.setup();
        render(<RankingHelp />);
        
        const triggerButton = screen.getByRole('button', { name: /Ayuda sobre la puntuación/i });
        await user.click(triggerButton);
        
        // Ahora el modal debería ser visible
        expect(screen.getByText('¿Cómo se calcula la Puntuación?')).toBeInTheDocument();
        expect(screen.getByText(/Dificultad del Rival/i)).toBeInTheDocument();
    });

    test('3. Cierra el modal al hacer clic en el botón de la ✖', async () => {
        const user = userEvent.setup();
        render(<RankingHelp />);
        
        // Abrimos el modal
        await user.click(screen.getByRole('button', { name: /Ayuda sobre la puntuación/i }));
        
        // Buscamos y hacemos clic en la ✖
        const closeButtonX = screen.getByText('✖');
        await user.click(closeButtonX);
        
        // Verificamos que se ha cerrado
        expect(screen.queryByText('¿Cómo se calcula la Puntuación?')).not.toBeInTheDocument();
    });

    test('4. Cierra el modal al hacer clic en el botón "Entendido"', async () => {
        const user = userEvent.setup();
        render(<RankingHelp />);
        
        // Abrimos el modal
        await user.click(screen.getByRole('button', { name: /Ayuda sobre la puntuación/i }));
        
        // Buscamos y hacemos clic en el botón "Entendido"
        const entendidoButton = screen.getByRole('button', { name: /Entendido/i });
        await user.click(entendidoButton);
        
        // Verificamos que se ha cerrado
        expect(screen.queryByText('¿Cómo se calcula la Puntuación?')).not.toBeInTheDocument();
    });

    test('5. Cierra el modal al hacer clic en el fondo oscuro (overlay)', async () => {
        const user = userEvent.setup();
        // Usamos render y destructuramos 'container' para buscar elementos por clase
        const { container } = render(<RankingHelp />);
        
        // Abrimos el modal
        await user.click(screen.getByRole('button', { name: /Ayuda sobre la puntuación/i }));
        
        // Buscamos el div del overlay usando su clase
        const overlay = container.querySelector('.ranking-help-overlay');
        expect(overlay).not.toBeNull();
        
        // Hacemos clic en el fondo
        if (overlay) await user.click(overlay);
        
        // Verificamos que se ha cerrado
        expect(screen.queryByText('¿Cómo se calcula la Puntuación?')).not.toBeInTheDocument();
    });

    test('6. NO cierra el modal si se hace clic dentro del contenido (stopPropagation)', async () => {
        const user = userEvent.setup();
        const { container } = render(<RankingHelp />);
        
        // Abrimos el modal
        await user.click(screen.getByRole('button', { name: /Ayuda sobre la puntuación/i }));
        
        // Buscamos el contenedor blanco del modal
        const modalContent = container.querySelector('.ranking-help-modal');
        expect(modalContent).not.toBeNull();
        
        // Hacemos clic dentro del modal (debería activarse el stopPropagation)
        if (modalContent) await user.click(modalContent);
        
        // Verificamos que el modal SIGUE ABIERTO
        expect(screen.getByText('¿Cómo se calcula la Puntuación?')).toBeInTheDocument();
    });
});