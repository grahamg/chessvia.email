const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const path = require('path');
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// SQLite setup
const db = new sqlite3.Database('./chessGames.db');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS moves (gameId TEXT, move TEXT)");
});

app.get('/', (req, res) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.post('/saveMove', (req, res) => {
    const gameId = req.body.gameId;
    const move = req.body.move;

    const stmt = db.prepare("INSERT INTO moves VALUES (?, ?)");
    stmt.run(gameId, move);
    stmt.finalize();

    res.send({ status: 'Move saved!' });
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}!`);
});
