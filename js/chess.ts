// js/chess.ts

// --- Type Definitions ---
export type PieceCode = 'P' | 'R' | 'N' | 'B' | 'Q' | 'K' | 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type SquareState = PieceCode | null;
export type BoardState = SquareState[][]; // 8x8 array [rank][file]

export interface AlgebraicMapping {
  row: number;
  col: number;
}

export type PlayerTurn = 'w' | 'b';


// --- Helper Functions ---

/**
 * Converts algebraic notation (e.g., "a1", "h8") to 0-indexed row and column.
 * Row 0 is rank '8', Row 7 is rank '1'. Column 0 is file 'a'.
 * @param algebraic The algebraic notation string.
 * @returns Object with row and col, or null if invalid.
 */
export function algebraicToIndices(algebraic: string): AlgebraicMapping | null {
    if (typeof algebraic !== 'string' || algebraic.length !== 2) return null;
    const file: string = algebraic.charAt(0);
    const rankChar: string = algebraic.charAt(1);

    const col: number = file.charCodeAt(0) - 'a'.charCodeAt(0);
    const row: number = 8 - parseInt(rankChar); // '1' -> 7, '8' -> 0

    if (col < 0 || col > 7 || row < 0 || row > 7 || isNaN(row)) {
        return null;
    }
    return { row, col };
}

/**
 * Converts 0-indexed row and column to algebraic notation.
 * Row 0 is rank '8', Row 7 is rank '1'. Column 0 is file 'a'.
 * @param row The 0-indexed row.
 * @param col The 0-indexed column.
 * @returns Algebraic notation string, or null if invalid.
 */
export function indicesToAlgebraic(row: number, col: number): string | null {
    if (row < 0 || row > 7 || col < 0 || col > 7) {
        return null;
    }
    const file: string = String.fromCharCode('a'.charCodeAt(0) + col);
    const rank: string = (8 - row).toString();
    return file + rank;
}


// --- Core Chess Logic ---

/**
 * Parses a FEN string and returns a 2D array representing the board state.
 * @param fenString The FEN string (only the piece placement part).
 * @returns 8x8 array [rank][file]
 *          board[0] is rank 8, board[7] is rank 1.
 *          board[0][0] is a8, board[7][0] is a1.
 *          'P' for white pawn, 'r' for black rook, etc. null for empty.
 */
export function fenToBoard(fenString: string): BoardState {
    const board: BoardState = Array(8).fill(null).map(() => Array(8).fill(null));
    const piecePlacement: string = fenString.split(' ')[0];
    const ranks: string[] = piecePlacement.split('/');

    for (let r = 0; r < ranks.length; r++) {
        const rankStr: string = ranks[r];
        let colIndex: number = 0;
        for (let charIndex = 0; charIndex < rankStr.length; charIndex++) {
            const char: string = rankStr[charIndex];
            if (isNaN(parseInt(char))) { // It's a piece
                if (colIndex < 8) {
                    board[r][colIndex] = char as PieceCode;
                    colIndex++;
                }
            } else { // It's a number representing empty squares
                colIndex += parseInt(char);
            }
        }
    }
    return board;
}

/**
 * Returns the Unicode character for a given piece code.
 * @param pieceCode Character representing the piece (e.g., 'P', 'r').
 * @returns Unicode character for the piece.
 */
export function getPieceUnicode(pieceCode: PieceCode | null): string {
    if (!pieceCode) return '';
    const pieces: Record<PieceCode, string> = {
        'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', // White
        'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚'  // Black
    };
    return pieces[pieceCode] || '';
}

/**
 * Checks if a move is pseudo-legal (doesn't consider checks/checkmates).
 * @param boardState The current 8x8 board state.
 * @param fromAlgebraic E.g., "e2".
 * @param toAlgebraic E.g., "e4".
 * @param playerTurn 'w' or 'b'.
 * @returns True if the move is pseudo-legal.
 */
export function isValidMove(boardState: BoardState, fromAlgebraic: string, toAlgebraic: string, playerTurn: PlayerTurn): boolean {
    const from: AlgebraicMapping | null = algebraicToIndices(fromAlgebraic);
    const to: AlgebraicMapping | null = algebraicToIndices(toAlgebraic);

    if (!from || !to) return false; // Invalid algebraic notation

    const piece: SquareState = boardState[from.row][from.col];
    if (!piece) return false; // No piece at source square

    // Check if the piece belongs to the current player
    const pieceIsWhite: boolean = piece === piece.toUpperCase();
    if ((playerTurn === 'w' && !pieceIsWhite) || (playerTurn === 'b' && pieceIsWhite)) {
        return false; // Trying to move opponent's piece
    }

    // Check if destination is occupied by a friendly piece
    const destPiece: SquareState = boardState[to.row][to.col];
    if (destPiece) {
        const destPieceIsWhite: boolean = destPiece === destPiece.toUpperCase();
        if ((playerTurn === 'w' && destPieceIsWhite) || (playerTurn === 'b' && !destPieceIsWhite)) {
            return false; // Cannot capture own piece
        }
    }

    const dr: number = to.row - from.row; // Change in row
    const dc: number = to.col - from.col; // Change in col
    const absDr: number = Math.abs(dr);
    const absDc: number = Math.abs(dc);

    switch (piece.toLowerCase()) {
        case 'p': // Pawn
            const moveDir: number = pieceIsWhite ? -1 : 1;
            if (dc === 0) { // Moving forward
                if (boardState[to.row][to.col]) return false;
                if (dr === moveDir) return true;
                if (dr === 2 * moveDir) {
                    const startingRank: number = pieceIsWhite ? 6 : 1;
                    return from.row === startingRank && !boardState[from.row + moveDir][from.col];
                }
            } else if (absDc === 1 && dr === moveDir) { // Capturing
                return !!boardState[to.row][to.col];
            }
            return false;
        case 'n': // Knight
            return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
        case 'b': // Bishop
            if (absDr !== absDc) return false;
            const stepR_b: number = dr / absDr;
            const stepC_b: number = dc / absDc;
            for (let i = 1; i < absDr; i++) {
                if (boardState[from.row + i * stepR_b][from.col + i * stepC_b]) return false;
            }
            return true;
        case 'r': // Rook
            if (dr !== 0 && dc !== 0) return false;
            if (dr === 0) {
                const stepC_r: number = dc / absDc;
                for (let i = 1; i < absDc; i++) {
                    if (boardState[from.row][from.col + i * stepC_r]) return false;
                }
            } else {
                const stepR_r: number = dr / absDr;
                for (let i = 1; i < absDr; i++) {
                    if (boardState[from.row + i * stepR_r][from.col]) return false;
                }
            }
            return true;
        case 'q': // Queen
            if (absDr === absDc) {
                const stepR_q_diag: number = dr / absDr;
                const stepC_q_diag: number = dc / absDc;
                for (let i = 1; i < absDr; i++) {
                    if (boardState[from.row + i * stepR_q_diag][from.col + i * stepC_q_diag]) return false;
                }
                return true;
            } else if (dr === 0 || dc === 0) {
                if (dr === 0) {
                    const stepC_q_hor: number = dc / absDc;
                    for (let i = 1; i < absDc; i++) {
                        if (boardState[from.row][from.col + i * stepC_q_hor]) return false;
                    }
                } else {
                    const stepR_q_ver: number = dr / absDr;
                    for (let i = 1; i < absDr; i++) {
                        if (boardState[from.row + i * stepR_q_ver][from.col]) return false;
                    }
                }
                return true;
            }
            return false;
        case 'k': // King
            return absDr <= 1 && absDc <= 1;
        default:
            return false; // Unknown piece
    }
}

/**
 * Creates a new board state by making a move.
 * @param boardState The current 8x8 board state.
 * @param fromAlgebraic E.g., "e2".
 * @param toAlgebraic E.g., "e4".
 * @returns The new board state after the move.
 */
export function makeMove(boardState: BoardState, fromAlgebraic: string, toAlgebraic: string): BoardState {
    const from: AlgebraicMapping | null = algebraicToIndices(fromAlgebraic);
    const to: AlgebraicMapping | null = algebraicToIndices(toAlgebraic);

    // It's good practice to handle potential nulls, even if previous logic (isValidMove) should prevent them.
    if (!from || !to) {
        console.error("Invalid algebraic notation passed to makeMove, returning original boardState.");
        return boardState;
    }

    const newBoardState: BoardState = boardState.map(row => [...row]); // Deep copy
    const piece: SquareState = newBoardState[from.row][from.col];

    newBoardState[to.row][to.col] = piece;
    newBoardState[from.row][from.col] = null;

    return newBoardState;
}

// --- Old ChessBoard class (can be removed or refactored if not used) ---
// class ChessBoard { ... } // Commenting out for now
