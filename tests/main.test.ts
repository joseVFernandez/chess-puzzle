// tests/main.test.ts
import { JSDOM } from 'jsdom';

// It's crucial that main.ts does NOT execute DOM-related code immediately upon import.
// It should wait for DOMContentLoaded or an explicit init call.
// For testing, we will call its functions after setting up the DOM.
import {
    initializeBoardUI,
    displayPieces,
    loadPuzzles,
    loadPuzzleByIndex,
    handleSquareClick,
    // These are global variables in main.ts, we'll need to manage their state or mock access.
    // For now, tests will try to manipulate them via (window as any) or rely on main.ts's own modifications.
    // currentPuzzle, puzzles, currentBoardState, playerTurn, selectedSquare, etc.
} from '../js/main'; // Adjust if main.ts exports these directly. For now, assume they are callable.

import { Puzzle } from '../js/main'; // Assuming Puzzle interface is exported from main.ts
import * as chess from '../js/chess';
import { BoardState, PlayerTurn, PieceCode } from '../js/chess'; // Assuming these types are exported

// Mock chess.js functions that main.js depends on
jest.mock('../js/chess', () => {
    const originalChess = jest.requireActual('../js/chess');
    return {
        ...originalChess,
        isValidMove: jest.fn(),
        makeMove: jest.fn(),
        // fenToBoard: jest.fn(originalChess.fenToBoard), // Keep original by default, can be spied on
    };
});

// Helper to set up DOM
const setupDOM = () => {
    const dom = new JSDOM(`
        <!DOCTYPE html>
        <html>
        <body>
            <div id="chessboard_container"><div id="chessboard"></div></div>
            <div id="puzzle_info_container">
                <div id="puzzle_description"></div>
                <div id="turn_indicator"></div>
            </div>
            <div id="message_area"></div>
            <button id="next_puzzle_button">Next Puzzle</button>
        </body>
        </html>
    `);
    global.document = dom.window.document;
    (global as any).window = dom.window; // Use 'any' to assign to window for JSDOM
    global.MouseEvent = dom.window.MouseEvent;

    // Manually assign elements to the global scope as main.ts might expect them there
    // This simulates how main.ts finds them after DOMContentLoaded
    (global as any).chessboardElement = document.getElementById('chessboard');
    (global as any).puzzleDescriptionElement = document.getElementById('puzzle_description');
    (global as any).turnIndicatorElement = document.getElementById('turn_indicator');
    (global as any).messageAreaElement = document.getElementById('message_area');
    (global as any).nextPuzzleButtonElement = document.getElementById('next_puzzle_button');

    // Reset main.ts's global state if possible. This is the hard part.
    // Best approach: main.ts should export an init/reset function.
    // Workaround: directly set them on (window as any) if main.ts uses globals that way,
    // or re-initialize them here if main.ts code structure allows.
    // For this example, we assume main.ts will re-query these on its own or its functions will be called after setup.
    // We also reset the state variables that are conceptually part of main.ts's module scope.
    (global as any).puzzles = [];
    (global as any).currentPuzzle = null;
    (global as any).currentPuzzleIndex = 0;
    (global as any).selectedSquare = null;
    (global as any).playerTurn = 'w';
    (global as any).currentBoardState = [];
};

const mockPuzzles: Puzzle[] = [
    { id: "p1", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", solution: ["e2e4", "e7e5"], description: "Test Puzzle 1", turn: 'w' },
    { id: "p2", fen: "4k3/8/8/8/8/8/8/R3K3 w Q - 0 1", solution: ["a1a8"], description: "Test Puzzle 2", turn: 'w' },
];

describe('main.ts', () => {
    // Explicitly type the mock instances
    let mockChessIsValidMove: jest.MockedFunction<typeof chess.isValidMove>;
    let mockChessMakeMove: jest.MockedFunction<typeof chess.makeMove>;

    beforeEach(() => {
        setupDOM();

        // Re-assign mocks for each test to ensure clean state
        mockChessIsValidMove = chess.isValidMove as jest.MockedFunction<typeof chess.isValidMove>;
        mockChessMakeMove = chess.makeMove as jest.MockedFunction<typeof chess.makeMove>;

        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(JSON.parse(JSON.stringify(mockPuzzles))), // Deep copy
            })
        ) as jest.Mock;

        // Initialize main.ts's state by re-setting its module-level variables
        // This is a direct manipulation for test purposes.
        // In main.ts, these are `let puzzles: Puzzle[] = [];`, etc.
        // We need to tell TS these exist on the global (window) scope for tests to modify them.
        (window as any).puzzles = [];
        (window as any).currentPuzzle = null;
        (window as any).currentPuzzleIndex = 0;
        (window as any).selectedSquare = null;
        (window as any).playerTurn = 'w';
        (window as any).currentBoardState = [];

        // Call this to ensure DOM elements in main.ts are re-queried based on new JSDOM
        // This depends on how main.ts is structured. If it queries DOM elements globally once,
        // then setupDOM() handles it. If it queries inside functions, it's fine.
        // For this test setup, we assume main.ts's global variables for DOM elements are set by setupDOM.
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('initializeBoardUI', () => {
        it('should create 64 squares with correct classes and attributes', () => {
            initializeBoardUI();
            const chessboard = document.getElementById('chessboard')!;
            expect(chessboard.children.length).toBe(64);
            const firstSquare = chessboard.children[0] as HTMLDivElement;
            expect(firstSquare.classList.contains('square')).toBe(true);
            // Based on (rankIndex + fileIndex) % 2 === 0 for light, a8 (0,0) is light.
            expect(firstSquare.classList.contains('light-square')).toBe(true);
            expect(firstSquare.dataset.algebraic).toBe('a8');
            const secondSquare = chessboard.children[1] as HTMLDivElement;
            expect(secondSquare.classList.contains('dark-square')).toBe(true);

            const lastSquare = chessboard.children[63] as HTMLDivElement;
            expect(lastSquare.dataset.algebraic).toBe('h1');
             // h1: rankIndex 7, fileIndex 7. (7+7)%2 = 0 -> light-square
            expect(lastSquare.classList.contains('light-square')).toBe(true);
        });
    });

    describe('displayPieces', () => {
        it('should display pieces on the board correctly', () => {
            initializeBoardUI();
            const boardState: BoardState = chess.fenToBoard("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
            (window as any).currentBoardState = boardState;
            displayPieces(boardState);

            const a8 = document.querySelector('[data-algebraic="a8"]')!;
            expect(a8.textContent).toBe(chess.getPieceUnicode('r'));
            expect(a8.children[0].classList.contains('black')).toBe(true);

            const e2 = document.querySelector('[data-algebraic="e2"]')!;
            expect(e2.textContent).toBe(chess.getPieceUnicode('P'));
            expect(e2.children[0].classList.contains('white')).toBe(true);

            const d4 = document.querySelector('[data-algebraic="d4"]')!;
            expect(d4.textContent).toBe('');
        });
    });

    describe('Puzzle Loading', () => {
        it('loadPuzzles should fetch and load the first puzzle', async () => {
            initializeBoardUI(); // Needs to be called so displayPieces within loadPuzzleByIndex works
            await loadPuzzles();
            expect(fetch).toHaveBeenCalledWith('puzzles/puzzles.json');

            // Access main.ts's module-level variables (exposed via window for testing)
            expect((window as any).puzzles.length).toBe(2);
            expect((window as any).currentPuzzle.id).toBe('p1');
            expect(document.getElementById('puzzle_description')!.textContent).toBe("Test Puzzle 1");

            const a8 = document.querySelector('[data-algebraic="a8"]')!;
            expect(a8.textContent).toBe(chess.getPieceUnicode('r'));
        });

        it('loadPuzzleByIndex should load a specific puzzle', () => {
            (window as any).puzzles = JSON.parse(JSON.stringify(mockPuzzles));
            (window as any).currentPuzzleIndex = 0;
            initializeBoardUI();

            loadPuzzleByIndex(1);
            expect((window as any).currentPuzzle.id).toBe('p2');
            expect(document.getElementById('puzzle_description')!.textContent).toBe("Test Puzzle 2");
            const a1 = document.querySelector('[data-algebraic="a1"]')!;
            expect(a1.textContent).toBe(chess.getPieceUnicode('R'));
            expect(document.getElementById('turn_indicator')!.textContent).toBe("White to move");
        });
    });

    describe('handleSquareClick', () => {
        beforeEach(async () => {
            initializeBoardUI();
            // Directly set main.ts's puzzles array for this test suite
            (window as any).puzzles = JSON.parse(JSON.stringify(mockPuzzles));
            // Load the first puzzle to set up currentPuzzle, currentBoardState etc. in main.ts
            loadPuzzleByIndex(0);
        });

        it('should select a piece on first valid click', () => {
            const e2 = document.querySelector('[data-algebraic="e2"]') as HTMLDivElement;
            handleSquareClick({ currentTarget: e2 } as unknown as MouseEvent);
            expect(e2.classList.contains('selected')).toBe(true);
            expect((window as any).selectedSquare).toBe('e2');
            expect(document.getElementById('message_area')!.textContent).toBe('Piece selected. Click destination square.');
        });

        it('should do nothing if selecting opponent piece or empty square first', () => {
            const e7 = document.querySelector('[data-algebraic="e7"]') as HTMLDivElement;
            handleSquareClick({ currentTarget: e7 } as unknown as MouseEvent);
            expect(e7.classList.contains('selected')).toBe(false);
            expect((window as any).selectedSquare).toBeNull();
            expect(document.getElementById('message_area')!.textContent).toBe('Not your turn or not your piece.');

            const d4 = document.querySelector('[data-algebraic="d4"]') as HTMLDivElement;
            handleSquareClick({ currentTarget: d4 } as unknown as MouseEvent);
            expect(d4.classList.contains('selected')).toBe(false);
            expect((window as any).selectedSquare).toBeNull();
            expect(document.getElementById('message_area')!.textContent).toBe('Clicked an empty square. Select a piece.');
        });

        it('should make a move if valid and correct (player matches solution part 1 - player move)', () => {
            mockChessIsValidMove.mockReturnValue(true);
            const initialBoardState = chess.fenToBoard(mockPuzzles[0].fen);
            const boardAfterE2E4 = chess.makeMove(initialBoardState, 'e2', 'e4');
            mockChessMakeMove.mockReturnValueOnce(boardAfterE2E4); // For player's e2e4

            const e2 = document.querySelector('[data-algebraic="e2"]') as HTMLDivElement;
            handleSquareClick({ currentTarget: e2 } as unknown as MouseEvent);
            const e4 = document.querySelector('[data-algebraic="e4"]') as HTMLDivElement;
            handleSquareClick({ currentTarget: e4 } as unknown as MouseEvent);

            expect(mockChessIsValidMove).toHaveBeenCalledWith(expect.anything(), 'e2', 'e4', 'w');
            expect(mockChessMakeMove).toHaveBeenCalledWith(expect.anything(), 'e2', 'e4');
            expect(document.getElementById('message_area')!.textContent).toBe('Correct move!');
            expect(e4.textContent).toBe(chess.getPieceUnicode('P')); // Piece moved
            expect((window as any).playerTurn).toBe('b'); // Turn switched for computer
        });

        it('should make a move and trigger computer response (player matches solution part 2 - computer move)', () => {
            // Setup for player's first move (e2e4)
            mockChessIsValidMove.mockReturnValue(true); // Assume all moves in solution are valid
            const initialBoardState = chess.fenToBoard(mockPuzzles[0].fen); // rnbqkbnr/...
            const boardAfterE2E4 = chess.makeMove(initialBoardState, 'e2', 'e4'); // Board after e2e4
            const boardAfterE7E5 = chess.makeMove(boardAfterE2E4, 'e7', 'e5');   // Board after e7e5 (computer)

            mockChessMakeMove.mockReturnValueOnce(boardAfterE2E4); // For player's e2e4
            mockChessMakeMove.mockReturnValueOnce(boardAfterE7E5); // For computer's e7e5

            const e2 = document.querySelector('[data-algebraic="e2"]') as HTMLDivElement;
            handleSquareClick({ currentTarget: e2 } as unknown as MouseEvent); // Select e2
            const e4 = document.querySelector('[data-algebraic="e4"]') as HTMLDivElement;
            handleSquareClick({ currentTarget: e4 } as unknown as MouseEvent); // Move e2 to e4 (triggers computer e7e5)

            // After player's e2e4:
            expect(document.getElementById('message_area')!.textContent).toBe('Correct move!'); // Message for player's move
            // Board should reflect e2e4
            expect(document.querySelector('[data-algebraic="e4"]')?.textContent).toBe(chess.getPieceUnicode('P'));
            expect(document.querySelector('[data-algebraic="e2"]')?.textContent).toBe('');

            // After computer's automatic e7e5:
            // Check that isValidMove and makeMove were called for the computer's move
            expect(mockChessIsValidMove).toHaveBeenCalledWith(boardAfterE2E4, 'e7', 'e5', 'b');
            expect(mockChessMakeMove).toHaveBeenCalledWith(boardAfterE2E4, 'e7', 'e5');
            // Board should reflect e7e5
            expect(document.querySelector('[data-algebraic="e5"]')?.textContent).toBe(chess.getPieceUnicode('p'));
            expect(document.querySelector('[data-algebraic="e7"]')?.textContent).toBe('');
            expect((window as any).playerTurn).toBe('w'); // Turn switched back to player
            expect((window as any).currentPuzzle.currentMoveIndexInSolution).toBe(2); // Both moves made
        });

        it('should handle puzzle solved scenario', () => {
            (window as any).puzzles = [{ id: "psolved", fen: "4k3/8/8/8/8/8/8/R3K2R w K - 0 1", solution: ["a1a8"], description: "Mate", turn: 'w' }];
            loadPuzzleByIndex(0);

            mockChessIsValidMove.mockReturnValue(true);
            const mockFinalBoard = chess.fenToBoard("R3k3/8/8/8/8/8/8/4K2R b K - 0 1");
            mockChessMakeMove.mockReturnValue(mockFinalBoard);

            const a1 = document.querySelector('[data-algebraic="a1"]') as HTMLDivElement;
            handleSquareClick({ currentTarget: a1 } as unknown as MouseEvent);
            const a8 = document.querySelector('[data-algebraic="a8"]') as HTMLDivElement;
            handleSquareClick({ currentTarget: a8 } as unknown as MouseEvent);

            expect(document.getElementById('message_area')!.textContent).toBe('Puzzle Solved!');
            expect(document.getElementById('next_puzzle_button')!.style.display).toBe('block');
       });

        it('should handle incorrect (but valid piece-wise) move', () => {
            mockChessIsValidMove.mockReturnValue(true);
            // currentPuzzle.solution[0] is "e2e4"
            const d2 = document.querySelector('[data-algebraic="d2"]') as HTMLDivElement;
            handleSquareClick({ currentTarget: d2 } as unknown as MouseEvent);
            const d4 = document.querySelector('[data-algebraic="d4"]') as HTMLDivElement;
            handleSquareClick({ currentTarget: d4 } as unknown as MouseEvent);

            expect(document.getElementById('message_area')!.textContent).toBe('Incorrect move. Try again.');
            expect(document.querySelector('[data-algebraic="d2"]')!.textContent).toBe(chess.getPieceUnicode('P'));
            expect(document.querySelector('[data-algebraic="d4"]')!.textContent).toBe('');
        });

        it('should handle invalid (piece-wise) move', () => {
            mockChessIsValidMove.mockReturnValue(false);

            const e2 = document.querySelector('[data-algebraic="e2"]') as HTMLDivElement;
            handleSquareClick({ currentTarget: e2 } as unknown as MouseEvent);
            const e5 = document.querySelector('[data-algebraic="e5"]') as HTMLDivElement;
            handleSquareClick({ currentTarget: e5 } as unknown as MouseEvent);

            expect(document.getElementById('message_area')!.textContent).toBe('Invalid move for that piece.');
        });
   });

   describe('Next Puzzle Button', () => {
       it('should load the next puzzle when clicked', async () => {
           initializeBoardUI(); // Needs to be called for loadPuzzleByIndex to work
           await loadPuzzles(); // Loads 2 mock puzzles from fetch mock

           // Simulate first puzzle being solved to show the button
           const currentPuzzle = (window as any).currentPuzzle as Puzzle;
           currentPuzzle.currentMoveIndexInSolution = currentPuzzle.solution.length;
           document.getElementById('next_puzzle_button')!.style.display = 'block';

           document.getElementById('next_puzzle_button')!.click();

           expect((window as any).currentPuzzle.id).toBe('p2');
           expect(document.getElementById('puzzle_description')!.textContent).toBe("Test Puzzle 2");
           expect(document.getElementById('next_puzzle_button')!.style.display).toBe('none');
       });

       it('should show "All Puzzles Solved!" if no more puzzles', async () => {
            initializeBoardUI();
            await loadPuzzles(); // Loads 2 mock puzzles

            // Manually set to last puzzle and solve it
            loadPuzzleByIndex(1); // Load puzzle p2
            const currentPuzzle = (window as any).currentPuzzle as Puzzle;
            currentPuzzle.currentMoveIndexInSolution = currentPuzzle.solution.length;
            document.getElementById('next_puzzle_button')!.style.display = 'block';
            document.getElementById('next_puzzle_button')!.disabled = false;


            document.getElementById('next_puzzle_button')!.click(); // Attempt to load next after p2

            // It should try to load index 2, which is out of bounds for mockPuzzles (length 2)
            // loadPuzzleByIndex should then display the message
            expect(document.getElementById('message_area')!.textContent).toBe("No more puzzles available or invalid index.");
            expect(document.getElementById('next_puzzle_button')!.textContent).toBe("All Puzzles Solved!");
            expect(document.getElementById('next_puzzle_button')!.disabled).toBe(true);
        });
   });
});
