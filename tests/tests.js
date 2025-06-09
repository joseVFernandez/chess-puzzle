// tests/tests.js
console.log("Running Unit Tests...");
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`%cPASS: ${message}`, "color: green");
  } else {
    testsFailed++;
    console.error(`%cFAIL: ${message}`, "color: red");
  }
}

function assertEqual(actual, expected, message) {
    if (actual === expected) {
        testsPassed++;
        console.log(`%cPASS: ${message} (Expected: ${expected}, Got: ${actual})`, "color: green");
    } else {
        testsFailed++;
        console.error(`%cFAIL: ${message} (Expected: ${expected}, Got: ${actual})`, "color: red");
    }
}

function assertDeepEqual(actual, expected, message) {
    // Basic deep equal for simple objects and arrays of primitives/simple objects
    // Not a comprehensive deep equality check for all types.
    let isEqual = true;
    if (typeof actual !== typeof expected) {
        isEqual = false;
    } else if (Array.isArray(actual) && Array.isArray(expected)) {
        if (actual.length !== expected.length) {
            isEqual = false;
        } else {
            for (let i = 0; i < actual.length; i++) {
                if (typeof actual[i] === 'object' && typeof expected[i] === 'object') {
                    // Recurse for nested arrays/objects - limited depth for simplicity here
                    if (!JSON.stringify(actual[i]) === JSON.stringify(expected[i])) { // simple object comparison
                        isEqual = false;
                        break;
                    }
                } else if (actual[i] !== expected[i]) {
                    isEqual = false;
                    break;
                }
            }
        }
    } else if (typeof actual === 'object' && actual !== null && expected !== null) {
        // Basic object comparison (keys and shallow values)
        const actualKeys = Object.keys(actual);
        const expectedKeys = Object.keys(expected);
        if (actualKeys.length !== expectedKeys.length) {
            isEqual = false;
        } else {
            for (const key of actualKeys) {
                if (actual[key] !== expected[key]) {
                    isEqual = false;
                    break;
                }
            }
        }
    } else {
        isEqual = actual === expected;
    }

    if (isEqual) {
        testsPassed++;
        console.log(`%cPASS: ${message}`, "color: green");
    } else {
        testsFailed++;
        console.error(`%cFAIL: ${message} (Expected: ${JSON.stringify(expected)}, Got: ${JSON.stringify(actual)})`, "color: red");
    }
}


function printTestSummary() {
  console.log("\nTest Summary:");
  console.log(`%cPassed: ${testsPassed}`, "color: green");
  console.log(`%cFailed: ${testsFailed}`, testsFailed > 0 ? "color: red" : "color: green");
  if (testsFailed === 0) {
    console.log("%cAll tests passed!", "color: green; font-weight: bold;");
  } else {
    console.error("%cSome tests failed.", "color: red; font-weight: bold;");
  }
}

// --- Test Suites Below ---
// Will be added incrementally

// Dummy test to ensure structure works
// assert(true, "Test runner initialized."); // Remove dummy after adding real tests


// --- chess.js Tests ---

function testFenToBoard() {
    console.log("\n--- Testing fenToBoard ---");
    const startFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const board = fenToBoard(startFen);

    assert(board.length === 8, "Board should have 8 ranks (rows).");
    assert(board[0].length === 8, "Rank 8 should have 8 files (cols).");
    assert(board[7].length === 8, "Rank 1 should have 8 files (cols).");

    assertEqual(board[0][0], 'r', "a8 should be a black rook.");
    assertEqual(board[0][4], 'k', "e8 should be a black king.");
    assertEqual(board[1][0], 'p', "a7 should be a black pawn.");
    assertEqual(board[6][0], 'P', "a2 should be a white pawn.");
    assertEqual(board[7][0], 'R', "a1 should be a white rook.");
    assertEqual(board[7][4], 'K', "e1 should be a white king.");

    // Test FEN with empty ranks and specific pieces
    const testFen2 = "r1bqk1nr/pp1p1ppp/2n1p3/2b5/8/5NP1/PPP1PP1P/RNBQKB1R w KQkq - 0 1";
    const board2 = fenToBoard(testFen2);
    assertEqual(board2[0][0], 'r', "testFen2: a8 should be 'r'");
    assertEqual(board2[0][1], null, "testFen2: b8 should be empty (part of '1')");
    assertEqual(board2[0][2], 'b', "testFen2: c8 should be 'b'");
    assertEqual(board2[4][0], null, "testFen2: Rank 4 (index 4) should be all empty ('8') - checking a4");
    assertEqual(board2[4][7], null, "testFen2: Rank 4 (index 4) should be all empty ('8') - checking h4");
    assertEqual(board2[5][5], 'P', "testFen2: f3 (row 5, col 5) should be 'P'"); // 5.g3 ... Nf3 P
}

function testGetPieceUnicode() {
    console.log("\n--- Testing getPieceUnicode ---");
    assertEqual(getPieceUnicode('P'), '♙', "White Pawn Unicode");
    assertEqual(getPieceUnicode('p'), '♟', "Black Pawn Unicode");
    assertEqual(getPieceUnicode('R'), '♖', "White Rook Unicode");
    assertEqual(getPieceUnicode('r'), '♜', "Black Rook Unicode");
    assertEqual(getPieceUnicode('N'), '♘', "White Knight Unicode");
    assertEqual(getPieceUnicode('n'), '♞', "Black Knight Unicode");
    assertEqual(getPieceUnicode('B'), '♗', "White Bishop Unicode");
    assertEqual(getPieceUnicode('b'), '♝', "Black Bishop Unicode");
    assertEqual(getPieceUnicode('Q'), '♕', "White Queen Unicode");
    assertEqual(getPieceUnicode('q'), '♛', "Black Queen Unicode");
    assertEqual(getPieceUnicode('K'), '♔', "White King Unicode");
    assertEqual(getPieceUnicode('k'), '♚', "Black King Unicode");
    assertEqual(getPieceUnicode('X'), '', "Invalid piece code should return empty string.");
}

function testAlgebraicConversion() {
    console.log("\n--- Testing Algebraic Conversion ---");
    // algebraicToIndices: row 0 is rank '8', col 0 is file 'a'
    assertDeepEqual(algebraicToIndices("a1"), {row: 7, col: 0}, "a1 to indices {row: 7, col: 0}");
    assertDeepEqual(algebraicToIndices("h8"), {row: 0, col: 7}, "h8 to indices {row: 0, col: 7}");
    assertDeepEqual(algebraicToIndices("e4"), {row: 4, col: 4}, "e4 to indices {row: 4, col: 4}");
    assertEqual(algebraicToIndices("z9"), null, "Invalid algebraic 'z9' should return null.");
    assertEqual(algebraicToIndices("a"), null, "Invalid algebraic 'a' should return null.");

    // indicesToAlgebraic
    assertEqual(indicesToAlgebraic(7, 0), "a1", "Indices {7,0} to a1");
    assertEqual(indicesToAlgebraic(0, 7), "h8", "Indices {0,7} to h8");
    assertEqual(indicesToAlgebraic(4, 4), "e4", "Indices {4,4} to e4");
    assertEqual(indicesToAlgebraic(-1, 0), null, "Invalid indices {-1,0} should return null.");
    assertEqual(indicesToAlgebraic(0, 8), null, "Invalid indices {0,8} should return null.");
}


// --- Run chess.js Tests ---
testFenToBoard();
testGetPieceUnicode();
testAlgebraicConversion();
// More test suites for chess.js (isValidMove, makeMove) will be added here
function testIsValidMove() {
    console.log("\n--- Testing isValidMove ---");

    // Standard starting board for context, but many tests use custom boards
    const startBoard = fenToBoard("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");

    // --- PAWN MOVES ---
    // White Pawns
    let boardPawnW = fenToBoard("8/8/8/8/8/k7/P7/K7 w - - 0 1"); // White pawn on a2
    assert(isValidMove(boardPawnW, "a2", "a3", "w"), "Pawn: a2-a3 (1 step forward)");
    assert(isValidMove(boardPawnW, "a2", "a4", "w"), "Pawn: a2-a4 (2 steps from start)");
    assert(!isValidMove(boardPawnW, "a2", "a5", "w"), "Pawn: a2-a5 (invalid 3 steps)");

    boardPawnW = fenToBoard("8/8/8/8/P7/k7/8/K7 w - - 0 1"); // White pawn on a4 (already moved)
    assert(isValidMove(boardPawnW, "a4", "a5", "w"), "Pawn: a4-a5 (1 step forward, not initial)");
    assert(!isValidMove(boardPawnW, "a4", "a6", "w"), "Pawn: a4-a6 (invalid 2 steps, not initial)");

    // White Pawn Obstruction / Capture
    boardPawnW = fenToBoard("8/8/8/p7/P7/k7/8/K7 w - - 0 1"); // P on a4, p on a5
    assert(!isValidMove(boardPawnW, "a4", "a5", "w"), "Pawn: a4-a5 (blocked by opponent pawn)");
    boardPawnW = fenToBoard("8/8/8/P7/8/k7/P7/K7 w - - 0 1"); // P on a2, P on a5
    assert(!isValidMove(boardPawnW, "a2", "a3", "w"), "Pawn: a2-a3 (can move)"); // Should be true
    assert(isValidMove(boardPawnW, "a2", "a3", "w"), "Pawn: a2-a3 (no block)");
    assert(!isValidMove(boardPawnW, "a2", "a4", "w"), "Pawn: a2-a4 (blocked by own pawn on a3 if P was on a3)");
    // Need a board where a3 is blocked for a2-a4
    const boardPawnW_blockedA3 = fenToBoard("8/8/8/8/8/P7/P7/K7 w - - 0 1"); // P on a2, P on a3
    assert(!isValidMove(boardPawnW_blockedA3, "a2", "a4", "w"), "Pawn: a2-a4 (blocked by own piece on a3)");


    boardPawnW = fenToBoard("8/8/p7/8/P7/k7/8/K7 w - - 0 1"); // P on a4, p on b5 (incorrect setup for capture test)
    // Correct setup for capture: P on d4, p on e5
    boardPawnW = fenToBoard("8/8/8/4p3/3P4/8/k7/K7 w - - 0 1");
    assert(isValidMove(boardPawnW, "d4", "e5", "w"), "Pawn: d4xe5 (valid capture)");
    assert(!isValidMove(boardPawnW, "d4", "c5", "w"), "Pawn: d4xc5 (no piece to capture)");
    assert(!isValidMove(boardPawnW, "d4", "d5", "w"), "Pawn: d4-d5 (cannot capture forward)");

    // Black Pawns
    let boardPawnB = fenToBoard("k7/p7/K7/8/8/8/8/8 b - - 0 1"); // Black pawn on a7
    assert(isValidMove(boardPawnB, "a7", "a6", "b"), "Pawn Black: a7-a6 (1 step)");
    assert(isValidMove(boardPawnB, "a7", "a5", "b"), "Pawn Black: a7-a5 (2 steps from start)");
    assert(!isValidMove(boardPawnB, "a7", "a4", "b"), "Pawn Black: a7-a4 (invalid 3 steps)");

    // --- KNIGHT MOVES ---
    const boardKnight = fenToBoard("8/8/8/8/8/k1N5/8/K7 w - - 0 1"); // White Knight on c3
    assert(isValidMove(boardKnight, "c3", "d5", "w"), "Knight: c3-d5");
    assert(isValidMove(boardKnight, "c3", "e4", "w"), "Knight: c3-e4");
    assert(isValidMove(boardKnight, "c3", "e2", "w"), "Knight: c3-e2");
    assert(isValidMove(boardKnight, "c3", "d1", "w"), "Knight: c3-d1");
    assert(isValidMove(boardKnight, "c3", "b1", "w"), "Knight: c3-b1");
    assert(isValidMove(boardKnight, "c3", "a2", "w"), "Knight: c3-a2");
    assert(isValidMove(boardKnight, "c3", "a4", "w"), "Knight: c3-a4");
    assert(isValidMove(boardKnight, "c3", "b5", "w"), "Knight: c3-b5");
    assert(!isValidMove(boardKnight, "c3", "c4", "w"), "Knight: c3-c4 (invalid)");
    assert(!isValidMove(boardKnight, "c3", "d4", "w"), "Knight: c3-d4 (invalid)");
    // Knight capture (same as non-capture for knight)
    const boardKnightCap = fenToBoard("8/8/8/3p4/8/k1N5/8/K7 w - - 0 1"); // W Knight c3, B Pawn d5
    assert(isValidMove(boardKnightCap, "c3", "d5", "w"), "Knight: c3xd5 (capture)");
    // Knight cannot capture own piece
    const boardKnightOwn = fenToBoard("8/8/8/3P4/8/k1N5/8/K7 w - - 0 1"); // W Knight c3, W Pawn d5
    assert(!isValidMove(boardKnightOwn, "c3", "d5", "w"), "Knight: c3-d5 (cannot capture own piece)");

    // --- BISHOP MOVES ---
    const boardBishop = fenToBoard("8/8/8/8/4B3/k7/8/K7 w - - 0 1"); // White Bishop on e4
    assert(isValidMove(boardBishop, "e4", "h7", "w"), "Bishop: e4-h7 (valid diagonal)");
    assert(isValidMove(boardBishop, "e4", "b1", "w"), "Bishop: e4-b1 (valid diagonal)");
    assert(!isValidMove(boardBishop, "e4", "e5", "w"), "Bishop: e4-e5 (invalid, not diagonal)");
    const boardBishopBlocked = fenToBoard("8/8/8/5P2/4B3/k7/8/K7 w - - 0 1"); // Bishop e4, Pawn f5
    assert(!isValidMove(boardBishopBlocked, "e4", "g6", "w"), "Bishop: e4-g6 (blocked by own pawn f5)");
    const boardBishopCap = fenToBoard("8/8/5p2/8/4B3/k7/8/K7 w - - 0 1"); // Bishop e4, black pawn f5
    assert(isValidMove(boardBishopCap, "e4", "f5", "w"), "Bishop: e4xf5 (capture)");

    // --- ROOK MOVES ---
    const boardRook = fenToBoard("8/8/8/8/4R3/k7/8/K7 w - - 0 1"); // White Rook on e4
    assert(isValidMove(boardRook, "e4", "e8", "w"), "Rook: e4-e8 (valid file)");
    assert(isValidMove(boardRook, "e4", "h4", "w"), "Rook: e4-h4 (valid rank)");
    assert(!isValidMove(boardRook, "e4", "f5", "w"), "Rook: e4-f5 (invalid, not rank/file)");
    const boardRookBlocked = fenToBoard("8/8/8/8/4R1P1/k7/8/K7 w - - 0 1"); // Rook e4, Pawn f4
    assert(!isValidMove(boardRook, "e4", "h4", "w"), "Rook: e4-h4 (blocked by own pawn f4)");
    const boardRookCap = fenToBoard("8/8/8/8/4R1p1/k7/8/K7 w - - 0 1"); // Rook e4, black pawn f4
    assert(isValidMove(boardRookCap, "e4", "f4", "w"), "Rook: e4xf4 (capture)");

    // --- QUEEN MOVES ---
    const boardQueen = fenToBoard("8/8/8/8/4Q3/k7/8/K7 w - - 0 1"); // White Queen on e4
    assert(isValidMove(boardQueen, "e4", "h7", "w"), "Queen: e4-h7 (valid diagonal)");
    assert(isValidMove(boardQueen, "e4", "e8", "w"), "Queen: e4-e8 (valid file)");
    assert(isValidMove(boardQueen, "e4", "a4", "w"), "Queen: e4-a4 (valid rank)");
    assert(!isValidMove(boardQueen, "e4", "f6", "w"), "Queen: e4-f6 (invalid, not straight/diagonal)");
    const boardQueenBlocked = fenToBoard("8/8/8/5P2/4Q3/k7/8/K7 w - - 0 1"); // Queen e4, Pawn f5
    assert(!isValidMove(boardQueenBlocked, "e4", "g6", "w"), "Queen: e4-g6 (blocked by own pawn f5 - diag)");
    const boardQueenBlockedRank = fenToBoard("8/8/8/8/4Q1P1/k7/8/K7 w - - 0 1"); // Queen e4, Pawn f4
    assert(!isValidMove(boardQueenBlockedRank, "e4", "h4", "w"), "Queen: e4-h4 (blocked by own pawn f4 - rank)");


    // --- KING MOVES ---
    const boardKing = fenToBoard("8/8/8/8/4K3/k7/8/8 w - - 0 1"); // White King on e4
    assert(isValidMove(boardKing, "e4", "e5", "w"), "King: e4-e5");
    assert(isValidMove(boardKing, "e4", "d5", "w"), "King: e4-d5");
    assert(isValidMove(boardKing, "e4", "f3", "w"), "King: e4-f3");
    assert(!isValidMove(boardKing, "e4", "e6", "w"), "King: e4-e6 (invalid, >1 square)");
    assert(!isValidMove(boardKing, "e4", "g4", "w"), "King: e4-g4 (invalid, >1 square)");

    // --- GENERAL CHECKS ---
    // Cannot move opponent's piece
    assert(!isValidMove(startBoard, "e7", "e6", "w"), "General: White cannot move black pawn e7");
    assert(!isValidMove(startBoard, "e2", "e3", "b"), "General: Black cannot move white pawn e2");
}

function testMakeMove() {
    console.log("\n--- Testing makeMove ---");
    let board = fenToBoard("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");

    // Simple pawn move
    let newBoard = makeMove(board, "e2", "e4");
    assertEqual(newBoard[6][4], null, "makeMove: e2 should be empty after e2-e4");
    assertEqual(newBoard[4][4], 'P', "makeMove: e4 should have white pawn after e2-e4");
    assertDeepEqual(board[6][4], 'P', "makeMove: Original board e2 should still have pawn (immutability)");

    // Capture
    board = fenToBoard("8/8/8/4p3/3P4/8/k7/K7 w - - 0 1"); // d4 P, e5 p
    newBoard = makeMove(board, "d4", "e5");
    assertEqual(newBoard[4][3], null, "makeMove: d4 should be empty after d4xe5");
    assertEqual(newBoard[3][4], 'P', "makeMove: e5 should have white pawn after d4xe5 (capture)");
}


// --- Run chess.js Tests ---
testFenToBoard();
testGetPieceUnicode();
testAlgebraicConversion();
testIsValidMove();
testMakeMove();


// --- main.js Tests (Conceptual / Limited) ---
// As specified, these are conceptual.
// For example, if main.js had a non-DOM utility:
/*
function testMainJsUtility() {
    console.log("\n--- Testing main.js utility (example) ---");
    if (typeof someUtilityFunctionInMain === 'function') {
        assertEqual(someUtilityFunctionInMain(2, 2), 4, "someUtilityFunctionInMain(2,2) === 4");
    } else {
        console.log("Skipping main.js utility test as function not found (expected for this example).");
    }
}
testMainJsUtility();
*/

// --- Print Summary ---
printTestSummary();
// Add any testable main.js functions here.
// For now, we'll skip direct tests for DOM-heavy main.js functions.


// --- Print Summary ---
printTestSummary();
