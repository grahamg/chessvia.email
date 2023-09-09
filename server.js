const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const path = require('path');
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// SQLite setup
const db = new sqlite3.Database('./chessGames.db');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS games (gameId TEXT PRIMARY KEY NOT NULL, whitePlayerName TEXT NOT NULL, whitePlayerEmail TEXT NOT NULL, whitePlayerPassword TEXT, blackPlayerName TEXT NOT NULL, blackPlayerEmail TEXT NOT NULL, blackPlayerPassword TEXT);");
    db.run("CREATE TABLE IF NOT EXISTS moves (id INTEGER PRIMARY KEY NOT NULL, gameId TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, player TEXT NOT NULL, move TEXT NOT NULL, FOREIGN KEY (gameId) REFERENCES games(gameId));");
});

app.get('/', (req, res) => {
    res.render('pages/landing');
});

app.get('/new-game', (req, res) => {
    res.render('pages/new-game');
});

app.get('/game', (req, res) => {
    console.log("GET /game " + JSON.stringify(req.query));

    if (!req.query.whitePlayerEmail || !req.query.blackPlayerEmail) {
        console.log("Error saving game.");
        return res.send("Error saving game.");
    }

    if(req.query.whitePlayerPassword !== req.query.whitePlayerConfirmPassword) {
        console.log("Passwords do not match for the white player.");
        return res.send("Passwords do not match for the white player.");
    }

    const gameId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const whitePlayerPassword = req.query.whitePlayerPassword;
    const whitePlayerName = req.query.whitePlayerName;
    const whitePlayerEmail = req.query.whitePlayerEmail;
    const blackPlayerName = req.query.blackPlayerName;
    const blackPlayerEmail = req.query.blackPlayerEmail;
    const blackPlayerPassword = 'Test';

    const stmt = db.prepare("INSERT INTO games VALUES (?, ?, ?, ?, ?, ?, ?)");
    stmt.run(gameId, whitePlayerName, whitePlayerEmail, whitePlayerPassword, blackPlayerName, blackPlayerEmail, blackPlayerPassword, (err) => {
        if (err) {
            console.log(err);
            return res.send("Error saving game.");
        } else {
            console.log("Game saved successfully.");
        }
    });
    stmt.finalize();

    res.redirect(`/game/${gameId}`);
});

app.get('/game/:gameId', (req, res) => {
    const gameId = req.params.gameId;

    // Fetch game details
    db.all("SELECT * FROM games WHERE gameId = ?", [gameId], (err, game) => {
        if (err) {
            console.log(err);
            return res.send("Error loading game.");
        }

        // Fetch moves for the game
        db.all("SELECT * FROM moves WHERE gameId = ?", [gameId], (err, movesList) => {
            if (err) {
                console.log(err);
                return res.send("Error loading moves.");
            }

            // Render the template with the fetched data
            res.render('pages/game', {
                gameId: gameId,
                game: game[0],
                movesList: movesList
            });
        });
    });
});

app.post('/game/:gameId', (req, res) => {
    const gameId = req.body.gameId;
    const move = req.body.move;
    let player = move.color;
    let moveFromTo = `${move.from}-${move.to}`;

    try {
        const stmt = db.prepare("INSERT INTO moves (gameId, player, move) VALUES (?, ?, ?)");
        stmt.run(gameId, player, moveFromTo);
        stmt.finalize();
    } catch (err) {
        console.log(err);
        res.send({ status: 'error' });
    }

    console.log("POST: " + JSON.stringify({ gameId, player, moveFromTo }));
    res.send({ status: 'saved' });
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}!`);
});