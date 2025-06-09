// JavaScript file for chess logic

// --- Helper Functions ---

/**
 * Converts algebraic notation (e.g., "a1", "h8") to 0-indexed row and column.
 * Row 0 is rank '8', Row 7 is rank '1'. Column 0 is file 'a'.
 * @param {string} algebraic - The algebraic notation string.
 * @returns {{row: number, col: number}|null} Object with row and col, or null if invalid.
 */
function algebraicToIndices(algebraic) {
    if (typeof algebraic !== 'string' || algebraic.length !== 2) return null;
    const file = algebraic.charAt(0);
    const rank = algebraic.charAt(1);

    const col = file.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = 8 - parseInt(rank); // '1' -> 7, '8' -> 0

    if (col < 0 || col > 7 || row < 0 || row > 7 || isNaN(row)) {
        return null;
    }
    return { row, col };
}

/**
 * Converts 0-indexed row and column to algebraic notation.
 * Row 0 is rank '8', Row 7 is rank '1'. Column 0 is file 'a'.
 * @param {number} row - The 0-indexed row.
 * @param {number} col - The 0-indexed column.
 * @returns {string|null} Algebraic notation string, or null if invalid.
 */
function indicesToAlgebraic(row, col) {
    if (row < 0 || row > 7 || col < 0 || col > 7) {
        return null;
    }
    const file = String.fromCharCode('a'.charCodeAt(0) + col);
    const rank = (8 - row).toString();
    return file + rank;
}


// --- Core Chess Logic ---

/**
 * Parses a FEN string and returns a 2D array representing the board state.
 * @param {string} fenString - The FEN string (only the piece placement part).
 * @returns {Array<Array<string|null>>} 8x8 array [rank][file]
 *                                      board[0] is rank 8, board[7] is rank 1.
 *                                      board[0][0] is a8, board[7][0] is a1.
 *                                      'P' for white pawn, 'r' for black rook, etc. null for empty.
 */
function fenToBoard(fenString) {
    const board = Array(8).fill(null).map(() => Array(8).fill(null));
    const piecePlacement = fenString.split(' ')[0];
    const ranks = piecePlacement.split('/');

    for (let r = 0; r < ranks.length; r++) {
        const rankStr = ranks[r];
        let colIndex = 0; // Corrected from fileIndex to colIndex for clarity
        for (let char of rankStr) {
            if (isNaN(parseInt(char))) { // It's a piece
                if (colIndex < 8) {
                    board[r][colIndex] = char;
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
 * @param {string} pieceCode - Character representing the piece (e.g., 'P', 'r').
 * @returns {string} Unicode character for the piece.
 */
function getPieceUnicode(pieceCode) {
    const pieces = {
        'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', // White
        'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚'  // Black
    };
    return pieces[pieceCode] || '';
}

/**
 * Checks if a move is pseudo-legal (doesn't consider checks/checkmates).
 * @param {Array<Array<string|null>>} boardState - The current 8x8 board state.
 * @param {string} fromAlgebraic - E.g., "e2".
 * @param {string} toAlgebraic - E.g., "e4".
 * @param {string} playerTurn - 'w' or 'b'.
 * @returns {boolean} True if the move is pseudo-legal.
 */
function isValidMove(boardState, fromAlgebraic, toAlgebraic, playerTurn) {
    const from = algebraicToIndices(fromAlgebraic);
    const to = algebraicToIndices(toAlgebraic);

    if (!from || !to) return false; // Invalid algebraic notation

    const piece = boardState[from.row][from.col];
    if (!piece) return false; // No piece at source square

    // Check if the piece belongs to the current player
    const pieceIsWhite = piece === piece.toUpperCase();
    if ((playerTurn === 'w' && !pieceIsWhite) || (playerTurn === 'b' && pieceIsWhite)) {
        return false; // Trying to move opponent's piece
    }

    // Check if destination is occupied by a friendly piece
    const destPiece = boardState[to.row][to.col];
    if (destPiece) {
        const destPieceIsWhite = destPiece === destPiece.toUpperCase();
        if ((playerTurn === 'w' && destPieceIsWhite) || (playerTurn === 'b' && !destPieceIsWhite)) {
            return false; // Cannot capture own piece
        }
    }

    const dr = to.row - from.row; // Change in row
    const dc = to.col - from.col; // Change in col
    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    switch (piece.toLowerCase()) {
        case 'p': // Pawn
            const moveDir = pieceIsWhite ? -1 : 1; // White moves from higher row index to lower (e.g. 6 to 4 for e2e4)
            if (dc === 0) { // Moving forward
                if (boardState[to.row][to.col]) return false; // Cannot move forward to occupied square
                if (dr === moveDir) return true; // Move one square
                if (dr === 2 * moveDir) { // Move two squares
                    const startingRank = pieceIsWhite ? 6 : 1; // Row index for starting rank
                    return from.row === startingRank && !boardState[from.row + moveDir][from.col];
                }
            } else if (absDc === 1 && dr === moveDir) { // Capturing
                return !!boardState[to.row][to.col]; // Must have a piece to capture
            }
            return false;
        case 'n': // Knight
            return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
        case 'b': // Bishop
            if (absDr !== absDc) return false;
            // Check for obstructions
            const stepR_b = dr / absDr;
            const stepC_b = dc / absDc;
            for (let i = 1; i < absDr; i++) {
                if (boardState[from.row + i * stepR_b][from.col + i * stepC_b]) return false;
            }
            return true;
        case 'r': // Rook
            if (dr !== 0 && dc !== 0) return false;
            // Check for obstructions
            if (dr === 0) { // Horizontal move
                const stepC_r = dc / absDc;
                for (let i = 1; i < absDc; i++) {
                    if (boardState[from.row][from.col + i * stepC_r]) return false;
                }
            } else { // Vertical move
                const stepR_r = dr / absDr;
                for (let i = 1; i < absDr; i++) {
                    if (boardState[from.row + i * stepR_r][from.col]) return false;
                }
            }
            return true;
        case 'q': // Queen
            if (absDr === absDc) { // Diagonal move
                const stepR_q_diag = dr / absDr;
                const stepC_q_diag = dc / absDc;
                for (let i = 1; i < absDr; i++) {
                    if (boardState[from.row + i * stepR_q_diag][from.col + i * stepC_q_diag]) return false;
                }
                return true;
            } else if (dr === 0 || dc === 0) { // Rank/file move
                if (dr === 0) { // Horizontal move
                    const stepC_q_hor = dc / absDc;
                    for (let i = 1; i < absDc; i++) {
                        if (boardState[from.row][from.col + i * stepC_q_hor]) return false;
                    }
                } else { // Vertical move
                    const stepR_q_ver = dr / absDr;
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
 * @param {Array<Array<string|null>>} boardState - The current 8x8 board state.
 * @param {string} fromAlgebraic - E.g., "e2".
 * @param {string} toAlgebraic - E.g., "e4".
 * @returns {Array<Array<string|null>>} The new board state after the move.
 */
function makeMove(boardState, fromAlgebraic, toAlgebraic) {
    const from = algebraicToIndices(fromAlgebraic);
    const to = algebraicToIndices(toAlgebraic);

    if (!from || !to) return boardState; // Should not happen if isValidMove was called

    const newBoardState = boardState.map(row => [...row]); // Deep copy
    const piece = newBoardState[from.row][from.col];

    newBoardState[to.row][to.col] = piece;
    newBoardState[from.row][from.col] = null;

    return newBoardState;
}


// --- Old ChessBoard class (can be removed or refactored if not used) ---
// class ChessBoard { ... } // Commenting out for now
