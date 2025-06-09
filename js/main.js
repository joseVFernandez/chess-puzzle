// Main JavaScript file for the chess puzzle application

// --- Global Variables & Constants ---
// const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"; // Replaced by puzzle FEN
let currentBoardState = null; // Will hold the 8x8 array from fenToBoard
let puzzles = []; // To store all loaded puzzles.
let currentPuzzle = null; // The currently active puzzle object.
let currentPuzzleIndex = 0; // Index of the current puzzle in the puzzles array.
let selectedSquare = null; // Stores the algebraic notation of the currently selected square (e.g., 'e2').
let playerTurn = 'w'; // Whose turn it is to move (this will be set by the puzzle).
let messageArea = null;
let nextPuzzleButton = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeBoardUI();
    messageArea = document.getElementById('message_area');
    nextPuzzleButton = document.getElementById('next_puzzle_button');
    nextPuzzleButton.addEventListener('click', () => loadPuzzleByIndex(currentPuzzleIndex + 1));

    loadPuzzles(); // Load puzzles and then the first puzzle
});

async function loadPuzzles() {
    try {
        const response = await fetch('puzzles/puzzles.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        puzzles = await response.json();
        console.log("All puzzles loaded:", puzzles);
        if (puzzles.length > 0) {
            loadPuzzleByIndex(0);
        } else {
            console.error("No puzzles found in puzzles.json");
            document.getElementById('puzzle_description').textContent = "No puzzles available.";
        }
    } catch (error) {
        console.error("Failed to load puzzles file:", error);
        document.getElementById('puzzle_description').textContent = "Error loading puzzles.";
    }
}

function loadPuzzleByIndex(index) {
    if (index < 0 || index >= puzzles.length) {
        console.error("Invalid puzzle index:", index);
        return;
    }
    currentPuzzle = puzzles[index];
    currentPuzzleIndex = index;
    playerTurn = currentPuzzle.turn;
    currentPuzzle.currentMoveIndexInSolution = 0; // Initialize/reset puzzle progress

    console.log("Loading puzzle:", currentPuzzle.id, "FEN:", currentPuzzle.fen);
    currentBoardState = fenToBoard(currentPuzzle.fen); // from chess.js
    displayPieces(currentBoardState);

    // Update UI elements
    const descriptionEl = document.getElementById('puzzle_description');
    if (descriptionEl) descriptionEl.textContent = currentPuzzle.description;

    updateTurnIndicator();

    if (messageArea) {
        messageArea.textContent = '';
        messageArea.className = ''; // Clear any success/error styling
    }
    if (nextPuzzleButton) nextPuzzleButton.style.display = 'none';

    // Clear any previous selection
    if (selectedSquare) {
        const prevSelectedElement = document.querySelector(`.square[data-algebraic="${selectedSquare}"]`);
        if (prevSelectedElement) prevSelectedElement.classList.remove('selected');
        selectedSquare = null;
    }

    console.log(`Puzzle ${currentPuzzle.id} loaded. ${playerTurn === 'w' ? 'White' : 'Black'}'s turn.`);

    // Check if the first move is by the computer (e.g. if puzzle.turn is opponent of first solution move player)
    // This is more advanced, for now assume user makes the first move as per currentPuzzle.turn
}

function updateTurnIndicator() {
    const turnIndicatorEl = document.getElementById('turn_indicator');
    if (turnIndicatorEl) {
        turnIndicatorEl.textContent = `${playerTurn === 'w' ? 'White' : 'Black'} to move`;
    }
}

function displayMessage(text, type = "info") {
    if (!messageArea) return;
    messageArea.textContent = text;
    messageArea.className = ''; // Clear previous classes
    if (type === "success") {
        messageArea.classList.add('success');
    } else if (type === "error") {
        messageArea.classList.add('error');
    }
}


// displayPuzzle function is effectively replaced by loadPuzzleByIndex and its UI updates.
// We can remove or refactor the old displayPuzzle if it's no longer used.
// For now, let's comment it out to ensure no conflicts.
/*
function displayPuzzle(puzzle) {
    const puzzleContainer = document.getElementById('puzzle-container');
    if (puzzleContainer) {
        puzzleContainer.innerHTML = `
            <h2>Puzzle ID: ${puzzle.id}</h2>
            <p>FEN: ${puzzle.fen}</p>
            <p>To Solve: ${puzzle.description}</p>
        `;
    }
    currentBoardState = fenToBoard(puzzle.fen);
    displayPieces(currentBoardState);
    console.log("Displaying puzzle:", puzzle.id);
}
*/

function initializeBoardUI() {
    const chessboard = document.getElementById('chessboard');
    if (!chessboard) {
        console.error("Chessboard element not found!");
        return;
    }
    chessboard.innerHTML = ''; // Clear existing squares if any

    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
        for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
            const square = document.createElement('div');
            square.classList.add('square');
            const algebraicName = files[fileIndex] + (8 - rankIndex);
            square.dataset.algebraic = algebraicName;

            if ((rankIndex + fileIndex) % 2 === 0) {
                square.classList.add('light-square');
            } else {
                square.classList.add('dark-square');
            }

            square.addEventListener('click', handleSquareClick);
            chessboard.appendChild(square);
        }
    }
    console.log("Chessboard UI initialized.");
}

function displayPieces(boardState) {
    if (!boardState) {
        console.error("Board state is not available to display pieces.");
        return;
    }
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
        for (let fileIndex = 0; fileIndex < 8; fileIndex++) {
            const pieceCode = boardState[rankIndex][fileIndex];
            const algebraicName = files[fileIndex] + (8 - rankIndex);
            const squareElement = document.querySelector(`.square[data-algebraic="${algebraicName}"]`);

            if (squareElement) {
                squareElement.innerHTML = '';
                if (pieceCode) {
                    const pieceUnicode = getPieceUnicode(pieceCode);
                    const pieceElement = document.createElement('span');
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

function handleSquareClick(event) {
    const clickedSquareElement = event.currentTarget;
    const clickedSquareAlgebraic = clickedSquareElement.dataset.algebraic;

    if (!currentPuzzle) return; // No puzzle loaded

    // Clear message area on new click
    // displayMessage("", "info"); // Clears message. Can be too quick if an error is shown.

    if (selectedSquare === null) { // First click: selecting a piece
        const pieceCodeOnSquare = currentBoardState[algebraicToIndices(clickedSquareAlgebraic).row][algebraicToIndices(clickedSquareAlgebraic).col];
        if (pieceCodeOnSquare) {
            const isWhitePiece = pieceCodeOnSquare === pieceCodeOnSquare.toUpperCase();
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
        const sourceSquare = selectedSquare;
        const destinationSquare = clickedSquareAlgebraic;

        // Visually deselect the source square
        const prevSelectedElement = document.querySelector(`.square[data-algebraic="${sourceSquare}"]`);
        if (prevSelectedElement) prevSelectedElement.classList.remove('selected');

        selectedSquare = null; // Reset selection regardless of move outcome

        if (sourceSquare === destinationSquare) { // Clicked same square
            displayMessage("Selection cancelled.", "info");
            return;
        }

        // Validate move
        if (!isValidMove(currentBoardState, sourceSquare, destinationSquare, playerTurn)) {
            displayMessage("Invalid move for that piece.", "error");
            return;
        }

        // Move is pseudo-legal, now check against puzzle solution
        const attemptedMoveString = sourceSquare + destinationSquare;
        const expectedMoveString = currentPuzzle.solution[currentPuzzle.currentMoveIndexInSolution];

        if (attemptedMoveString === expectedMoveString) {
            // Player's move is correct
            currentBoardState = makeMove(currentBoardState, sourceSquare, destinationSquare);
            displayPieces(currentBoardState);
            currentPuzzle.currentMoveIndexInSolution++;
            displayMessage("Correct move!", "success");

            if (currentPuzzle.currentMoveIndexInSolution >= currentPuzzle.solution.length) {
                displayMessage("Puzzle Solved!", "success");
                if (nextPuzzleButton) nextPuzzleButton.style.display = 'block';
                if (currentPuzzleIndex >= puzzles.length -1) {
                    nextPuzzleButton.textContent = "All Puzzles Solved!";
                    nextPuzzleButton.disabled = true;
                } else {
                    nextPuzzleButton.textContent = "Next Puzzle";
                    nextPuzzleButton.disabled = false;
                }
                return; // Puzzle finished
            }

            // Switch turn and check for computer's response if any
            playerTurn = (playerTurn === 'w') ? 'b' : 'w';
            updateTurnIndicator();

            // Check if next move in solution is for the new playerTurn (computer's move)
            // This simple check assumes solution alternates turns correctly.
            // A more robust system would check FEN turn part if available in solution.
            const nextExpectedMove = currentPuzzle.solution[currentPuzzle.currentMoveIndexInSolution];
            // Simple assumption: if playerTurn changed, it's computer's turn if there's a next move.
            // This logic needs to be more robust if puzzles can have multiple moves for the same player.
            // For now, assume solution always alternates.

            // Let's simulate the computer's move immediately if it's defined.
            // This is a simplification. Real puzzles might need player to click again, or have specific turn indication in solution.
            // We need to know WHOSE move is specified in solution[i]. For now, assume strict alternation.

            // The puzzle's "turn" field indicates the STARTING player for the puzzle solution part.
            // If puzzle.turn is 'w', solution[0] is white's move. solution[1] is black's, etc.
            // Whose turn is solution[currentPuzzle.currentMoveIndexInSolution]?
            let currentSolutionMovePlayer = currentPuzzle.turn;
            if (currentPuzzle.currentMoveIndexInSolution % 2 !== 0) { // If index is odd, it's the other player's move
                 currentSolutionMovePlayer = (currentPuzzle.turn === 'w') ? 'b' : 'w';
            }


            if (playerTurn === currentSolutionMovePlayer) { // It's computer's turn based on solution array
                console.log("Computer to play...");
                const compMoveString = currentPuzzle.solution[currentPuzzle.currentMoveIndexInSolution];
                const compFromSq = compMoveString.substring(0, 2);
                const compToSq = compMoveString.substring(2, 4);

                // Computer move should also be validated for safety, though ideally solution is always valid
                if (isValidMove(currentBoardState, compFromSq, compToSq, playerTurn)) {
                    currentBoardState = makeMove(currentBoardState, compFromSq, compToSq);
                    displayPieces(currentBoardState);
                    currentPuzzle.currentMoveIndexInSolution++;
                     // displayMessage("Computer responds.", "info"); // Can be chatty

                    if (currentPuzzle.currentMoveIndexInSolution >= currentPuzzle.solution.length) {
                        displayMessage("Puzzle Solved! (after computer move)", "success");
                         if (nextPuzzleButton) nextPuzzleButton.style.display = 'block';
                         if (currentPuzzleIndex >= puzzles.length -1) {
                            nextPuzzleButton.textContent = "All Puzzles Solved!";
                            nextPuzzleButton.disabled = true;
                        } else {
                            nextPuzzleButton.textContent = "Next Puzzle";
                            nextPuzzleButton.disabled = false;
                        }
                        return; // Puzzle finished
                    }
                } else {
                    console.error("Invalid computer move in solution:", compMoveString);
                    displayMessage("Error in puzzle solution (computer move).", "error");
                    // Potentially stop the puzzle or flag it
                }
                // Switch turn back to player
                playerTurn = (playerTurn === 'w') ? 'b' : 'w';
                updateTurnIndicator();
            }


        } else {
            displayMessage("Incorrect move. Try again.", "error");
            // Do not update board state, player needs to retry their current move.
        }
    }
}
