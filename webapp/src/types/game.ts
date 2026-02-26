/*
 * Aqui creamos los tipos del modelo de dominio
*/ 

/* The difference of using type and interface is that type is more flexible 
 * and can be used to define a union type, 
 * while interface is more strict and can only be used to define an object type. 
 * In this case, we can use either one. 
 */
export type Player = "PLAYER_ONE" | "PLAYER_TWO" | null;

export interface TableCell {
    id: number;
    x: number;
    y: number;
    z: number;
    owner: Player;
}

export interface GameBoard {
    size: number;  // tamaño del tablero (número de filas)
    cells: TableCell[];  // array de celdas con x,y,z,id,owner
}


