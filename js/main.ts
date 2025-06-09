// js/main.ts
import { BoardState, PlayerTurn, fenToBoard, getPieceUnicode, isValidMove, makeMove, algebraicToIndices, PieceCode, SquareState } from './chess.js';

// --- Type Definitions for main.ts specific structures ---
export interface Puzzle {
  id: string;
  fen: string;
  solution: string[];
  description: string;
  turn: PlayerTurn; // Whose turn it is to make the first move of the solution
  currentMoveIndexInSolution?: number; // Optional: tracks current step in solution
}

// --- Global Variables & Constants ---
let currentBoardState: BoardState = [];
let puzzles: Puzzle[] = [];
let currentPuzzle: Puzzle | null = null;
let currentPuzzleIndex: number = 0;
let selectedSquare: string | null = null; // Algebraic notation of the selected square
let playerTurn: PlayerTurn = 'w';

// DOM Elements (typed)
let chessboardElement: HTMLDivElement | null = null;
let puzzleDescriptionElement: HTMLDivElement | null = null;
let turnIndicatorElement: HTMLDivElement | null = null;
let messageAreaElement: HTMLDivElement | null = null;
let nextPuzzleButtonElement: HTMLButtonElement | null = null;


document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM element references
    chessboardElement = document.getElementById('chessboard') as HTMLDivElement;
    puzzleDescriptionElement = document.getElementById('puzzle_description') as HTMLDivElement;
    turnIndicatorElement = document.getElementById('turn_indicator') as HTMLDivElement;
    messageAreaElement = document.getElementById('message_area') as HTMLDivElement;
    nextPuzzleButtonElement = document.getElementById('next_puzzle_button') as HTMLButtonElement;

    if (!chessboardElement || !puzzleDescriptionElement || !turnIndicatorElement || !messageAreaElement || !nextPuzzleButtonElement) {
        console.error("Fatal Error: Could not find one or more essential DOM elements.");
        return;
    }

    initializeBoardUI();
    nextPuzzleButtonElement.addEventListener('click', () => {
        if (currentPuzzleIndex + 1 < puzzles.length) {
            loadPuzzleByIndex(currentPuzzleIndex + 1);
        } else {
            displayMessage("All puzzles solved!", "success");
            if(nextPuzzleButtonElement) { // Check again because of TS strict null checks
                nextPuzzleButtonElement.textContent = "All Puzzles Solved!";
                nextPuzzleButtonElement.disabled = true;
            }
        }
    });

    loadPuzzles(); // Load puzzles and then the first puzzle
});

async function loadPuzzles(): Promise<void> {
    try {
        const response: Response = await fetch('puzzles/puzzles.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        puzzles = await response.json() as Puzzle[];
        console.log("All puzzles loaded:", puzzles);
        if (puzzles.length > 0) {
            loadPuzzleByIndex(0);
        } else {
            console.error("No puzzles found in puzzles.json");
            if (puzzleDescriptionElement) {
                puzzleDescriptionElement.textContent = "No puzzles available.";
            }
        }
    } catch (error) {
        console.error("Failed to load puzzles file:", error);
        if (puzzleDescriptionElement) {
            puzzleDescriptionElement.textContent = "Error loading puzzles.";
        }
    }
}

function loadPuzzleByIndex(index: number): void {
    if (index < 0 || index >= puzzles.length) {
        console.error("Invalid puzzle index:", index);
        // Potentially display this error to the user in messageAreaElement
        displayMessage("No more puzzles available or invalid index.", "error");
        if (nextPuzzleButtonElement) {
             nextPuzzleButtonElement.textContent = "All Puzzles Solved!";
             nextPuzzleButtonElement.disabled = true;
        }
        return;
    }
    currentPuzzle = puzzles[index];
    currentPuzzleIndex = index;
    playerTurn = currentPuzzle.turn;
    currentPuzzle.currentMoveIndexInSolution = 0;

    console.log("Loading puzzle:", currentPuzzle.id, "FEN:", currentPuzzle.fen);
    currentBoardState = fenToBoard(currentPuzzle.fen);
    displayPieces(currentBoardState);

    if (puzzleDescriptionElement) puzzleDescriptionElement.textContent = currentPuzzle.description;
    updateTurnIndicator();

    displayMessage("", "info"); // Clear message area
    if (nextPuzzleButtonElement) {
        nextPuzzleButtonElement.style.display = 'none';
        nextPuzzleButtonElement.disabled = false; // Re-enable if it was disabled
        nextPuzzleButtonElement.textContent = "Next Puzzle"; // Reset text
    }

    if (selectedSquare) {
        const prevSelectedElement: HTMLDivElement | null = document.querySelector(`.square[data-algebraic="${selectedSquare}"]`);
        if (prevSelectedElement) prevSelectedElement.classList.remove('selected');
        selectedSquare = null;
    }

    console.log(`Puzzle ${currentPuzzle.id} loaded. ${playerTurn === 'w' ? 'White' : 'Black'}'s turn.`);
}

function updateTurnIndicator(): void {
    if (turnIndicatorElement) {
        turnIndicatorElement.textContent = `${playerTurn === 'w' ? 'White' : 'Black'} to move`;
    }
}

function displayMessage(text: string, type: 'success' | 'error' | 'info' = "info"): void {
    if (!messageAreaElement) return;
    messageAreaElement.textContent = text;
    messageAreaElement.className = ''; // Clear previous classes
    if (type === "success") {
        messageAreaElement.classList.add('success');
    } else if (type === "error") {
        messageAreaElement.classList.add('error');
    }
}

function initializeBoardUI(): void {
    if (!chessboardElement) {
        console.error("Chessboard element not found for UI initialization!");
        return;
    }
    chessboardElement.innerHTML = '';

    const files: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
        for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
            const squareDiv: HTMLDivElement = document.createElement('div');
            squareDiv.classList.add('square');
            const algebraicName: string = files[fileIndex] + (8 - rankIndex);
            squareDiv.dataset.algebraic = algebraicName;

            if ((rankIndex + fileIndex) % 2 === 0) {
                squareDiv.classList.add('light-square');
            } else {
                squareDiv.classList.add('dark-square');
            }

            squareDiv.addEventListener('click', handleSquareClick as EventListener);
            chessboardElement.appendChild(squareDiv);
        }
    }
    console.log("Chessboard UI initialized.");
}

function displayPieces(boardState: BoardState): void {
    if (!boardState) {
        console.error("Board state is not available to display pieces.");
        return;
    }
    const files: string[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
        for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
            const pieceCode: SquareState = boardState[rankIndex][fileIndex];
            const algebraicName: string = files[fileIndex] + (8 - rankIndex);
            const squareElement: HTMLDivElement | null = document.querySelector(`.square[data-algebraic="${algebraicName}"]`);

            if (squareElement) {
                squareElement.innerHTML = '';
                if (pieceCode) {
                    const pieceUnicode: string = getPieceUnicode(pieceCode);
                    const pieceElement: HTMLSpanElement = document.createElement('span');
                    pieceElement.classList.add('piece');
                    pieceElement.textContent = pieceUnicode;

                    if (pieceCode === pieceCode.toUpperCase()) {
                        pieceElement.classList.add('white');
                    } else {
                        pieceElement.classList.add('black');
                    }
                    squareElement.appendChild(pieceElement);
                }
            }
        }
    }
    console.log("Pieces displayed on board.");
}

function handleSquareClick(event: MouseEvent): void {
    const clickedSquareElement = event.currentTarget as HTMLDivElement;
    if (!clickedSquareElement || !clickedSquareElement.dataset.algebraic) return;

    const clickedSquareAlgebraic: string = clickedSquareElement.dataset.algebraic;

    if (!currentPuzzle || typeof currentPuzzle.currentMoveIndexInSolution === 'undefined') {
        displayMessage("No puzzle loaded or puzzle state error.", "error");
        return;
    }

    const indices = algebraicToIndices(clickedSquareAlgebraic);
    if (!indices) {
        console.error("Invalid algebraic notation from clicked square:", clickedSquareAlgebraic);
        return;
    }

    if (selectedSquare === null) { // First click: selecting a piece
        const pieceCodeOnSquare: SquareState = currentBoardState[indices.row][indices.col];
        if (pieceCodeOnSquare) {
            const isWhitePiece: boolean = pieceCodeOnSquare === pieceCodeOnSquare.toUpperCase();
            if ((playerTurn === 'w' && isWhitePiece) || (playerTurn === 'b' && !isWhitePiece)) {
                selectedSquare = clickedSquareAlgebraic;
                clickedSquareElement.classList.add('selected');
                displayMessage("Piece selected. Click destination square.", "info");
            } else {
                displayMessage("Not your turn or not your piece.", "error");
            }
        } else {
            displayMessage("Clicked an empty square. Select a piece.", "info");
        }
    } else { // Second click: selecting a destination
        const sourceSquare: string = selectedSquare;
        const destinationSquare: string = clickedSquareAlgebraic;

        const prevSelectedElement: HTMLDivElement | null = document.querySelector(`.square[data-algebraic="${sourceSquare}"]`);
        if (prevSelectedElement) prevSelectedElement.classList.remove('selected');

        selectedSquare = null;

        if (sourceSquare === destinationSquare) {
            displayMessage("Selection cancelled.", "info");
            return;
        }

        if (!isValidMove(currentBoardState, sourceSquare, destinationSquare, playerTurn)) {
            displayMessage("Invalid move for that piece.", "error");
            return;
        }

        const attemptedMoveString: string = sourceSquare + destinationSquare;
        const expectedMoveString: string = currentPuzzle.solution[currentPuzzle.currentMoveIndexInSolution];

        if (attemptedMoveString === expectedMoveString) {
            currentBoardState = makeMove(currentBoardState, sourceSquare, destinationSquare);
            displayPieces(currentBoardState);
            currentPuzzle.currentMoveIndexInSolution++;
            displayMessage("Correct move!", "success");

            if (currentPuzzle.currentMoveIndexInSolution >= currentPuzzle.solution.length) {
                displayMessage("Puzzle Solved!", "success");
                if (nextPuzzleButtonElement) {
                    nextPuzzleButtonElement.style.display = 'block';
                    if (currentPuzzleIndex >= puzzles.length -1) {
                        nextPuzzleButtonElement.textContent = "All Puzzles Solved!";
                        nextPuzzleButtonElement.disabled = true;
                    } else {
                        nextPuzzleButtonElement.textContent = "Next Puzzle";
                        nextPuzzleButtonElement.disabled = false;
                    }
                }
                return;
            }

            playerTurn = (playerTurn === 'w') ? 'b' : 'w';
            updateTurnIndicator();

            let currentSolutionMovePlayer: PlayerTurn = currentPuzzle.turn;
            if (currentPuzzle.currentMoveIndexInSolution % 2 !== 0) {
                 currentSolutionMovePlayer = (currentPuzzle.turn === 'w') ? 'b' : 'w';
            }

            if (playerTurn === currentSolutionMovePlayer && currentPuzzle.currentMoveIndexInSolution < currentPuzzle.solution.length) {
                console.log("Computer to play...");
                const compMoveString: string = currentPuzzle.solution[currentPuzzle.currentMoveIndexInSolution];
                const compFromSq: string = compMoveString.substring(0, 2);
                const compToSq: string = compMoveString.substring(2, 4);

                if (isValidMove(currentBoardState, compFromSq, compToSq, playerTurn)) {
                    currentBoardState = makeMove(currentBoardState, compFromSq, compToSq);
                    displayPieces(currentBoardState);
                    currentPuzzle.currentMoveIndexInSolution++;

                    if (currentPuzzle.currentMoveIndexInSolution >= currentPuzzle.solution.length) {
                        displayMessage("Puzzle Solved! (after computer move)", "success");
                         if (nextPuzzleButtonElement) {
                            nextPuzzleButtonElement.style.display = 'block';
                            if (currentPuzzleIndex >= puzzles.length -1) {
                                nextPuzzleButtonElement.textContent = "All Puzzles Solved!";
                                nextPuzzleButtonElement.disabled = true;
                            } else {
                                nextPuzzleButtonElement.textContent = "Next Puzzle";
                                nextPuzzleButtonElement.disabled = false;
                            }
                        }
                        return;
                    }
                } else {
                    console.error("Invalid computer move in solution:", compMoveString);
                    displayMessage("Error in puzzle solution (computer move).", "error");
                }
                playerTurn = (playerTurn === 'w') ? 'b' : 'w';
                updateTurnIndicator();
            }
        } else {
            displayMessage("Incorrect move. Try again.", "error");
        }
    }
}
