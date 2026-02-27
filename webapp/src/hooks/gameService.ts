import type {TableCell} from "../types/game";

// src/services/gameService.ts

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

// Llama al backend con el estado actual y devuelve la respuesta YEN
// export async function sendMove(cells: TableCell[], size: number): Promise<YENResponse> {
//     const layout = cellsToYENLayout(cells, size);
//     const body = {
//         size,
//         turn: "R",           // tras el movimiento del humano, toca la máquina (R)
//         players: ["B", "R"],
//         layout
//     };
//     
//     const res = await fetch(`${BACKEND_URL}/play`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body)
//     });
//     
//     return res.json();
// }