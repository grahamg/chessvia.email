const boardElement = 'board';
const boardConfig = {
  visible: false,
  draggable: true,
  position: 'start',
  onDrop: () => handleMove,
  pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

const game = new Chess();
const board = Chessboard(boardElement, boardConfig);

const getGameTurn = () => {
    if (game.turn() === 'w') {
        return `It's white's turn to move.`
    } else if (game.turn() === 'b') {
        return `It's black's turn to move.`
    }
};

const checkPayerPassword = (gameId, player, password) => {
    const xhr = new XMLHttpRequest();
    xhr.addEventListener('loadend', (e) => {
        console.log(`${log.textContent}${e.type}: ${e.loaded} bytes transferred\n`);
    });
    xhr.open('POST', `/game/${gameId}/check-password`, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify({ gameId, player, password }));
    return xhr;
};

const handleMove = (source, target, piece, newPos, oldPos, orientation) => {
    // Check if the move is valid
    const gameId = window.location.href.split('/').at(-1);
    const move = game.move({
        from: source,
        to: target,
        orientation: orientation
    });

    // If the move is invalid, reset the board
    if (!move) {
        document.getElementById('status').innerHTML = `You've made an invalid move: ${source}-${target}`;
        return 'snapback';
    } else {
        document.getElementById('status').innerHTML = `
        <form id="passwordForm">
        <label for="submitMove">Enter your password to submit your move of ${move.from}-${move.to}</label>
        <input type="password" name="submitMove" id="pass">
        <button type="submit">Submit</button>
        <button type="button" id="cancelButton">Cancel</button>
        </form>`;

        document.getElementById('cancelButton').addEventListener('click', function(event) {
            console.log("Cancel button clicked");
            // Reset the board
            board.position(game.undo());
            document.getElementById('status').innerHTML = `Your move (${move.from}-${move.to}) was cancelled. `;
            document.getElementById('status').innerHTML += getGameTurn();
        });

        document.getElementById('passwordForm').addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent the default form submission

            let gameId = window.location.href.split('/').at(4);
            let enteredPassword = document.getElementById('pass').value;
            let boardOrientation = board.orientation();
            console.log(`submitting check-password: gameId: ${gameId}, enteredPassword: ${enteredPassword}, boardOrientation: ${boardOrientation}`);

            fetch(`/game/${gameId}/check-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ gameId, enteredPassword, boardOrientation }),
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
                    document.getElementById('status').innerHTML = `Your move (${move.from}-${move.to}) has been submitted. `;
                    document.getElementById('status').innerHTML += getGameTurn();
                } else if (data.status === 'error') {
                    alert('Your password was invalid. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
    }
};

// Game board startup tasks
(function(gameBoardMoves) {
    // Get the game status, namely whose turn it is.
    document.getElementById('status').innerHTML = getGameTurn();

    // Initialize the game board with existing moves.
    gameBoardMoves.forEach((i) => {
        board.move(i);
    });

    // Make the populated board visible.
    board.visible = true;
})(gameBoardMoves);
