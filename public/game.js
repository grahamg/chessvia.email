const boardElement = 'board';
const boardConfig = {
  draggable: true,
  position: 'start',
  onDrop: handleMove,
  pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
};

const game = new Chess();
const board = Chessboard(boardElement, boardConfig);

let getGameTurn = () => {
    if (game.turn() === 'w') {
        return `It's white's turn to move.`
    } else if (game.turn() === 'b') {
        return `It's black's turn to move.`
    }
};

let getPlayerVsPlayer = () => {
    return `White: ${tplWhitePlayer} vs Black: ${tplBlackPlayer}`;
};

let getMoves = () => {
    return Node;
}

document.getElementById('status').innerHTML = getGameTurn();
document.getElementById('player-vs-player').innerHTML = getPlayerVsPlayer();
document.getElementById('moves').innerHTML = getMoves();

function handleMove(source, target, piece, newPos, oldPos, orientation) {
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
        // Send the move to the server
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/game/${gameId}`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify({ gameId, move }));

        // Update the status
        document.getElementById('status').innerHTML = getGameTurn();
    }

}