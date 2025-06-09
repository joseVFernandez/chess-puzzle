// tests/chess.test.ts
import {
    fenToBoard,
    getPieceUnicode,
    algebraicToIndices,
    indicesToAlgebraic,
    isValidMove,
    makeMove,
    BoardState,
    PieceCode,
    PlayerTurn,
    AlgebraicMapping
} from '../js/chess'; // Adjust path if needed, will be dist/js/chess.js after compilation

describe('chess.ts', () => {
    describe('fenToBoard', () => {
        it('should parse the standard starting FEN string correctly', () => {
            const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
            const board = fenToBoard(fen);
            expect(board.length).toBe(8);
            expect(board[0].length).toBe(8);
            expect(board[0][0]).toBe('r'); // Black rook at a8
            expect(board[7][7]).toBe('R'); // White rook at h1
            expect(board[1][0]).toBe('p'); // Black pawn at a7
            expect(board[6][0]).toBe('P'); // White pawn at a2
            expect(board[3][3]).toBeNull(); // Empty square d5 (0-indexed from a8)
        });

        it('should parse FEN with empty ranks', () => {
            const fen = "rnbqkbnr/8/8/8/8/8/8/RNBQKBNR w KQkq - 0 1";
            const board = fenToBoard(fen);
            expect(board[1].every(sq => sq === null)).toBe(true); // Rank 7 (index 1)
            expect(board[0][0]).toBe('r');
        });

        it('should handle complex FEN strings', () => {
             const fen = "r1bqk1nr/pp1p1ppp/2n1p3/2b5/4P3/5N2/PPP2PPP/RNBQKB1R w KQkq - 0 1";
             const board = fenToBoard(fen);
             expect(board[0][1]).toBeNull(); // b8 is empty
             expect(board[2][2]).toBe('n'); // c6 black knight (rank 6 is index 2)
             expect(board[3][2]).toBe('b'); // c5 black bishop (rank 5 is index 3)
             expect(board[4][4]).toBe('P'); // e4 white pawn (rank 4 is index 4)
        });

        // Consider adding a test for a FEN that's deliberately malformed,
        // though current fenToBoard is quite permissive.
        // e.g. it('should handle malformed FEN gracefully', () => { ... });
    });

    describe('getPieceUnicode', () => {
        // Corrected black pawn unicode to include variation selector for consistent rendering if needed
        const pieces: { code: PieceCode | string, unicode: string }[] = [
            { code: 'P', unicode: '♙' }, { code: 'p', unicode: '♟' }, // Some terminals/fonts might need '♟︎'
            { code: 'R', unicode: '♖' }, { code: 'r', unicode: '♜' },
            { code: 'N', unicode: '♘' }, { code: 'n', unicode: '♞' },
            { code: 'B', unicode: '♗' }, { code: 'b', unicode: '♝' },
            { code: 'Q', unicode: '♕' }, { code: 'q', unicode: '♛' },
            { code: 'K', unicode: '♔' }, { code: 'k', unicode: '♚' },
        ];
        pieces.forEach(p => {
            it(`should return correct unicode for piece code '${p.code}'`, () => {
                expect(getPieceUnicode(p.code as PieceCode)).toBe(p.unicode);
            });
        });
        it('should return empty string for invalid piece code', () => {
            expect(getPieceUnicode('X' as PieceCode)).toBe(''); // Cast to satisfy type, testing invalid runtime value
            expect(getPieceUnicode(null)).toBe(''); // Test null case
        });
    });

    describe('algebraicToIndices and indicesToAlgebraic', () => {
        const conversions: { alg: string, indices: AlgebraicMapping }[] = [
            { alg: "a1", indices: { row: 7, col: 0 } }, { alg: "h1", indices: { row: 7, col: 7 } },
            { alg: "a8", indices: { row: 0, col: 0 } }, { alg: "h8", indices: { row: 0, col: 7 } },
            { alg: "e4", indices: { row: 4, col: 4 } },
        ];
        conversions.forEach(c => {
            it(`should convert ${c.alg} to {row: ${c.indices.row}, col: ${c.indices.col}}`, () => {
                expect(algebraicToIndices(c.alg)).toEqual(c.indices);
            });
            it(`should convert {row: ${c.indices.row}, col: ${c.indices.col}} to ${c.alg}`, () => {
                expect(indicesToAlgebraic(c.indices.row, c.indices.col)).toBe(c.alg);
            });
        });
        it('should return null for invalid algebraic input', () => {
            expect(algebraicToIndices("z9")).toBeNull();
            expect(algebraicToIndices("a9")).toBeNull();
            expect(algebraicToIndices("i1")).toBeNull();
            expect(algebraicToIndices("")).toBeNull();
            expect(algebraicToIndices("e")).toBeNull();
        });
         it('should return null for invalid index input', () => {
            expect(indicesToAlgebraic(-1, 0)).toBeNull();
            expect(indicesToAlgebraic(0, -1)).toBeNull();
            expect(indicesToAlgebraic(8, 0)).toBeNull();
            expect(indicesToAlgebraic(0, 8)).toBeNull();
        });
    });

    describe('isValidMove', () => {
        const initialBoard = fenToBoard("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
        const white: PlayerTurn = 'w';
        const black: PlayerTurn = 'b';

        // Pawn Moves
        describe('Pawn Moves', () => {
            it('should allow single square push', () => {
                expect(isValidMove(initialBoard, 'e2', 'e3', white)).toBe(true);
            });
            it('should allow double square push from starting rank', () => {
                expect(isValidMove(initialBoard, 'e2', 'e4', white)).toBe(true);
            });
            it('should not allow double square push after moving', () => {
                let board = makeMove(initialBoard, 'e2', 'e3'); // White moves e3
                board = makeMove(board, 'e7', 'e6'); // Black moves e6 (simulating a turn)
                expect(isValidMove(board, 'e3', 'e5', white)).toBe(false);
            });
            it('should not allow moving more than 2 squares from start', () => {
                 expect(isValidMove(initialBoard, 'e2', 'e5', white)).toBe(false);
            });
            it('should not allow moving backwards', () => {
                let board = makeMove(initialBoard, 'e2', 'e3');
                expect(isValidMove(board, 'e3', 'e2', white)).toBe(false);
            });
            it('should allow diagonal capture', () => {
                let board = fenToBoard("rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 1");
                expect(isValidMove(board, 'e4', 'd5', white)).toBe(true);
            });
            it('should not allow diagonal move to empty square', () => {
                expect(isValidMove(initialBoard, 'e2', 'd3', white)).toBe(false);
            });
            it('should not allow forward move to occupied square (own piece)', () => {
                let board = fenToBoard("rnbqkbnr/pppppppp/8/8/8/4P3/PPPP1PPP/RNBQKBNR w KQkq - 0 1"); // Pawn on e3
                board[6][4] = 'P'; // Manually place another white pawn at e2 for this test
                expect(isValidMove(board, 'e2', 'e3', white)).toBe(false);
            });
            it('should not allow forward move to occupied square (opponent piece)', () => {
                const board = fenToBoard("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1"); // e4 vs e5
                expect(isValidMove(board, 'e4', 'e5', white)).toBe(false);
            });
            it('should not allow 2-square push if intermediate square is blocked', () => {
                const board = fenToBoard("rnbqkbnr/pppppppp/8/8/8/4P3/PPPP1PPP/RNBQKBNR w KQkq - 0 1"); // Pawn on e3
                expect(isValidMove(board, 'e2', 'e4', white)).toBe(false);
            });
            // Black pawn tests
            it('black pawn: should allow single square push', () => {
                expect(isValidMove(initialBoard, 'e7', 'e6', black)).toBe(true);
            });
            it('black pawn: should allow double square push from starting rank', () => {
                expect(isValidMove(initialBoard, 'e7', 'e5', black)).toBe(true);
            });
        });

        describe('Knight Moves', () => {
            it('should allow L-shape moves', () => {
                expect(isValidMove(initialBoard, 'g1', 'f3', white)).toBe(true);
                expect(isValidMove(initialBoard, 'g1', 'h3', white)).toBe(true);
            });
            it('should allow capture', () => {
                 let board = fenToBoard("rnbqkbnr/ppp1pppp/8/3p4/8/2N5/PPPPPPPP/R1BQKBNR w KQkq - 0 1"); // Nc3, black d5 pawn
                 expect(isValidMove(board, 'c3', 'd5', white)).toBe(true); // Nc3xd5
            });
            it('should not allow non-L-shape moves', () => {
                expect(isValidMove(initialBoard, 'g1', 'g3', white)).toBe(false);
            });
            it('can jump over pieces', () => {
                expect(isValidMove(initialBoard, 'b1', 'c3', white)).toBe(true);
            });
        });

        describe('Rook Moves', () => {
            it('should allow horizontal/vertical moves to empty squares', () => {
                let board = fenToBoard("R7/8/8/8/8/8/8/k6K w - - 0 1");
                expect(isValidMove(board, 'a8', 'h8', white)).toBe(true);
                expect(isValidMove(board, 'a8', 'a1', white)).toBe(true);
            });
            it('should not allow diagonal moves', () => {
                let board = fenToBoard("R7/8/8/8/8/8/8/k6K w - - 0 1");
                expect(isValidMove(board, 'a8', 'b7', white)).toBe(false);
            });
            it('should be blocked by pieces', () => {
                let board = fenToBoard("R1N5/8/8/8/8/8/8/k6K w - - 0 1");
                expect(isValidMove(board, 'a8', 'd8', white)).toBe(false);
                board = fenToBoard("R1n5/8/8/8/8/8/8/k6K w - - 0 1");
                expect(isValidMove(board, 'a8', 'd8', white)).toBe(false);
                expect(isValidMove(board, 'a8', 'c8', white)).toBe(true);
            });
        });

        describe('Bishop Moves', () => {
            it('should allow diagonal moves to empty squares', () => {
                let board = fenToBoard("B7/8/8/8/8/8/8/k6K w - - 0 1");
                expect(isValidMove(board, 'a8', 'h1', white)).toBe(true);
            });
            it('should not allow non-diagonal moves', () => {
                 let board = fenToBoard("B7/8/8/8/8/8/8/k6K w - - 0 1");
                expect(isValidMove(board, 'a8', 'a7', white)).toBe(false);
            });
            it('should be blocked by pieces', () => {
                let board = fenToBoard("B1N5/1P6/8/8/8/8/8/k6K w - - 0 1");
                expect(isValidMove(board, 'a8', 'd5', white)).toBe(false);
                board = fenToBoard("B1n5/1p6/8/8/8/8/8/k6K w - - 0 1");
                expect(isValidMove(board, 'a8', 'd5', white)).toBe(false);
                expect(isValidMove(board, 'a8', 'b7', white)).toBe(true);
            });
        });

        describe('Queen Moves', () => {
            it('should allow horizontal/vertical/diagonal moves', () => {
                let board = fenToBoard("Q7/8/8/8/8/8/8/k6K w - - 0 1");
                expect(isValidMove(board, 'a8', 'h8', white)).toBe(true);
                expect(isValidMove(board, 'a8', 'a1', white)).toBe(true);
                expect(isValidMove(board, 'a8', 'h1', white)).toBe(true);
            });
            it('should be blocked like rook/bishop', () => {
                 let board = fenToBoard("Q1N5/1P6/8/8/8/8/8/k6K w - - 0 1");
                 expect(isValidMove(board, 'a8', 'e8', white)).toBe(false);
                 expect(isValidMove(board, 'a8', 'd5', white)).toBe(false);
            });
        });

        describe('King Moves', () => {
            it('should allow 1-square moves in any direction', () => {
                let board = fenToBoard("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
                expect(isValidMove(board, 'e1', 'd1', white)).toBe(true);
                expect(isValidMove(board, 'e1', 'e2', white)).toBe(true);
                expect(isValidMove(board, 'e1', 'd2', white)).toBe(true);
            });
            it('should not allow moves > 1 square', () => {
                let board = fenToBoard("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
                expect(isValidMove(board, 'e1', 'e3', white)).toBe(false);
                expect(isValidMove(board, 'e1', 'c1', white)).toBe(false);
            });
        });

        describe('General Rules', () => {
            it('should not allow moving opponent piece', () => {
                expect(isValidMove(initialBoard, 'e7', 'e6', white)).toBe(false);
            });
            it('should not allow capturing own piece', () => {
                let board = fenToBoard("rnbqkbnr/pppppppp/8/8/8/P7/1PPPPPPP/RNBQKBNR w KQkq - 0 1");
                expect(isValidMove(board, 'a1', 'a3', white)).toBe(false);
            });
             it('should return false if source square is empty', () => {
                 expect(isValidMove(initialBoard, 'e3', 'e4', white)).toBe(false);
             });
             it('should return false if fromAlgebraic or toAlgebraic is invalid', () => {
                 expect(isValidMove(initialBoard, 'z9', 'e4', white)).toBe(false);
                 expect(isValidMove(initialBoard, 'e2', 'z9', white)).toBe(false);
             });
        });
    });

    describe('makeMove', () => {
        it('should correctly move a piece on the board', () => {
            const board = fenToBoard("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
            const newBoard = makeMove(board, 'e2', 'e4');
            expect(newBoard[6][4]).toBeNull();
            expect(newBoard[4][4]).toBe('P');
            expect(board[6][4]).toBe('P');
            expect(board[4][4]).toBeNull();
        });

        it('should correctly handle captures', () => {
            const board = fenToBoard("rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 1");
            const newBoard = makeMove(board, 'e4', 'd5');
            expect(newBoard[4][4]).toBeNull();
            expect(newBoard[3][3]).toBe('P');
        });

         it('should return a new board instance (immutability)', () => {
             const board = fenToBoard("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
             const newBoard = makeMove(board, 'e2', 'e4');
             expect(newBoard).not.toBe(board);
             expect(newBoard[0]).not.toBe(board[0]);
         });
    });
});
