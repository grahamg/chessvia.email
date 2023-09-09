const board = Chessboard('board', 'start');
const game = new Chess();

board.position(game.fen());

board.on('move', (source, target) => {
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move) {
        fetch('/saveMove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                gameId: '23423', // This should be dynamic based on the game
                move: `${source}-${target}`
            })
        });
    } else {
        board.position(game.fen());
    }
});

