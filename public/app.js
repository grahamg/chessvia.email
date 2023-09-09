const boardElement = 'board';
const boardConfig = {
  draggable: true,
  position: 'start',
  onDrop: handleMove
};

const game = new Chess();
const board = Chessboard(boardElement, boardConfig);

function handleMove(source, target) {
    // Check if the move is valid
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Always promote to a queen for simplicity
    });

    // If the move is invalid, reset the board
    if (!move) {
        return 'snapback';
    }

    // TODO: You can add additional logic here, such as checking for game over
}

board.position(game.fen());
