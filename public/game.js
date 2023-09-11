const getGameTurn = () => {
    if (chess.turn() === 'w') {
        return `It's white's turn to move.`
    } else if (chess.turn() === 'b') {
        return `It's black's turn to move.`
    }
};

const handleOnMoveEnd = (oldPos, newPos) => {
    console.log(`Old position: ${JSON.stringify(oldPos)}`);
    console.log(`New position: ${JSON.stringify(newPos)}`);

    document.getElementById('status').innerHTML = getGameTurn();
}

const handleOnDrop = (source, target, piece, newPos, oldPos, orientation) => {
    //
    // Check if the move is valid
    //
    const gameId = window.location.href.split('/').at(-1);
    const move = chess.move({
        from: source,
        to: target,
        orientation: orientation
    });

    //
    // If the move is invalid, reset the board.
    //
    if (!move) {
        return 'snapback';
    }

    //
    // If the move is valid, check if the player has a valid password to submit their move.
    //
    document.getElementById('status').innerHTML = `
    <form id="passwordForm">
        <label for="submitMove">Enter your password to submit your move of ${move.from}-${move.to}</label>
        <input type="password" name="submitMove" id="pass">
        <button type="submit">Submit</button>
        <button type="button" id="cancelButton">Cancel</button>
    </form>`;

    //
    // Add event listener to the cancel button.
    //
    document.getElementById('cancelButton').addEventListener('click', function(event) {
        chess.move('e7e6'); // Dummy move to get the game turn to update.
        chess.undo();
        board.position(chess.fen());

        document.getElementById('status').innerHTML = getGameTurn();
    });

    //
    // Add event listener to the password form
    //
    document.getElementById('passwordForm').addEventListener('submit', function(event) {
        event.preventDefault();

        let gameId = window.location.href.split('/').at(4);
        let enteredPassword = document.getElementById('pass').value;
        // Get the game turn from the last move as it hasn't been submitted yet.
        let gameTurn = chess.turn() === 'w' ? 'b' : 'w';

        console.log(`submitting check-password: gameId: ${gameId}, enteredPassword: ${enteredPassword}, gameTurn: ${gameTurn}`);

        fetch(`/game/${gameId}/check-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameId, enteredPassword, gameTurn }),
        })
        .then(response => response.json()) // Assuming server responds with json
        .then(data => {
            console.log(`check-password response: ${data.status}`); // Should be `success`
            if (data.status === 'success') {
                // Send the move to the server
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `/game/${gameId}`, true);
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify({ gameId, move }));
        
                // Update the status
                document.getElementById('status').innerHTML = getGameTurn();
                window.location = `/game/${gameId}`;
            } else if (data.status === 'error') {
                alert('Your password was incorrect. Please try again.');
            }
        }).catch(error => {
            console.log(`Error submitting move: ${error}`);
        });
    });
}

//
// Initialize the board and game state.
//

const boardElement = 'board';
const boardConfig = {
  visible: false,
  draggable: true,
  position: 'start',
  onDrop: handleOnDrop,
  onMoveEnd: handleOnMoveEnd,
  pieceTheme: '../img/chesspieces/wikipedia/{piece}.png'
};

const chess = new Chess();
const board = Chessboard(boardElement, boardConfig);

// Initialize the game board with existing moves.
gameBoardMoves.forEach((i) => {
    const source = i.split('-')[0];
    const target = i.split('-')[1];
    const orientation = i.player === 'w' ? 'white' : 'black';

    chess.move({
        from: source,
        to: target,
        orientation: orientation
    });
});
board.position(chess.fen());

// See who made the most recent move, undefined in the case where
// nobody has moved yet.
const mostRecentMove = gameBoardMoves[gameBoardMoves.length - 1];
console.log(`mostRecentMove: ${JSON.stringify(mostRecentMove)}`);

// A player hasn't made the first move.
if (!mostRecentMove) {
    document.getElementById('status').innerHTML = `White makes the first move.`;
} else {
    document.getElementById('status').innerHTML = getGameTurn();
}

// Make the populated board visible.
board.visible = true;