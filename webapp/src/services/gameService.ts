import type {TableCell} from "../types/game";

// Sobre el flujo desde React:
//1. React arranca → POST /v1/game
//                   El servidor crea un GameY, le asigna un ID único (uuid)
//                   y lo guarda en el HashMap de AppState.
//                   Devuelve el estado inicial del tablero.
//
//2. El jugador mueve → POST /v1/game/{id}/move
//                      El servidor busca la partida por ID en el HashMap,
//                      aplica el movimiento, y si hay bot, lo hace jugar.
//                      Devuelve el tablero actualizado.
//
//3. React consulta → GET /v1/game/{id}
//                    El servidor busca la partida y devuelve su estado actual.


const BACKEND_URL = "http://localhost:4000";

// Convierte el array de celdas React → string layout YEN
export function cellsToYENLayout(cells: TableCell[], size: number): string {
    const rows: string[] = [];
    for (let row = 0; row < size; row++) {
        let rowStr = "";
        for (let col = 0; col <= row; col++) {
            const cell = cells.find(c => c.x === col && c.y === (row - col));
            if (!cell || !cell.owner) {
                rowStr += ".";
            } else if (cell.owner === "PLAYER_ONE") {
                rowStr += "B";
            } else {
                rowStr += "R";
            }
        }
        rows.push(rowStr);
    }
    return rows.join("/");
}
