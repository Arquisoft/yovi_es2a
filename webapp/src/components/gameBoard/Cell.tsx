import type { TableCell as TableCellModel } from "../../types/game";
import "./Cell.css"


// Extendemos la interfaz TableCell para tener las propiedades del modelo de dominio
interface TableCellProps extends TableCellModel {
    onClick: (id: number) => void;
}

// Crea el componente tableCell
export function TableCell({id, owner, onClick,}: TableCellProps): JSX.Element {
    // Al hacer click establecemos el propetario de la casilla
    const handleClick = () => {
        if (!owner) {
            onClick(id);
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            className={`table-cell ${owner ? owner.toLowerCase() : "empty"}`}
            onClick={handleClick}
            onKeyDown={(e) => {
                // Para que siga funcionando si alguien pulsa Enter o Espacio
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            aria-label={`Casilla ${id}`}
        />
    );
}