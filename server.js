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

// SQLite3 setup
const db = new sqlite3.Database('./chessGames.db');

// Create sqlite3 database tables if they don't exist.
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS games (gameId TEXT PRIMARY KEY NOT NULL, whitePlayerName TEXT NOT NULL, whitePlayerEmail TEXT NOT NULL, whitePlayerPassword TEXT, blackPlayerName TEXT NOT NULL, blackPlayerEmail TEXT NOT NULL, blackPlayerPassword TEXT);");
    db.run("CREATE TABLE IF NOT EXISTS moves (id INTEGER PRIMARY KEY NOT NULL, gameId TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, player TEXT NOT NULL, move TEXT NOT NULL, FOREIGN KEY (gameId) REFERENCES games(gameId));");
});

// Root landing page, explains the application concept.
app.get('/', (req, res) => {
    res.render('pages/landing');
});

// New game page, allows the user to create a new game, specifying
// the players and white's password.
app.get('/new-game', (req, res) => {
    res.render('pages/new-game');
});

// Create a new game, save it to the database, and redirect user to the
// game board page.
app.get('/game', (req, res) => {
    console.log("GET /game " + JSON.stringify(req.query));

    // Validate the request. If the request is invalid, return an error.
    if (!req.query.whitePlayerEmail || !req.query.blackPlayerEmail) {
        console.log("Error saving game.");
        return res.send("Error saving game.");
    }

    if(req.query.whitePlayerPassword !== req.query.whitePlayerConfirmPassword) {
        console.log("Passwords do not match for the white player.");
        return res.send("Passwords do not match for the white player.");
    }

    const gameId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    //The black player's password is not known yet, so set it to a dummy value.
    const blackPlayerPassword = 'Test';

    const stmt = db.prepare("INSERT INTO games VALUES (?, ?, ?, ?, ?, ?, ?)");
    stmt.run(gameId, req.query.whitePlayerName, req.query.whitePlayerEmail, req.query.whitePlayerPassword,
        req.query.blackPlayerName, req.query.blackPlayerEmail, blackPlayerPassword, (err) => {
            if (err) {
                console.log(err);
                return res.send("Error saving game.");
            } else {
                console.log("Game saved successfully.");
            }
    });
    stmt.finalize();

    // Redirect to the game board page
    res.redirect(`/game/${gameId}`);
});

// Game board page, displays the game board and allows the user to
// make moves.
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

// Join game page, allows black player to join a game by entering the
// game ID within the URI and their player password. The URI is emailed to them.
app.get('/game/:gameId/join', (req, res) => {
    const gameId = req.params.gameId;

    // Fetch moves for the game
    db.all("SELECT * FROM games WHERE gameId = ?", [gameId], (err, game) => {
        if (err) {
            console.log(err);
            return res.send("Error loading moves.");
        }

        res.render('pages/join-game', {
            gameId: gameId,
            game: game[0]
        });
    });
});

// Join game page, allows black player to join a game by entering the
// game ID within the URI and their player password. Handles join form submission.
app.post('/game/:gameId/join', (req, res) => {
    const gameId = req.body.gameId;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (password !== confirmPassword) {
        console.log("Passwords do not match for the black player.");
        return res.send("Passwords do not match for the black player.");
    }

    try {
        const stmt = db.prepare("UPDATE games SET blackPlayerPassword = ? WHERE gameId = ?");
        stmt.run(password, gameId);
        stmt.finalize();
    } catch (err) {
        console.log(err);
        return res.send({ status: 'error'});
    }

    console.log("POST: " + JSON.stringify(req.body));
    res.send({ status: 'success' });
});

// Save a board move to the database.
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
        return res.send("Error saving move.");
    }

    console.log("POST: " + JSON.stringify({ gameId, player, moveFromTo }));
    res.send({ status: 'saved' });
});

// Check the player's password against the database.
app.post('/game/:gameId/check-password', (req, res) => {
    const gameId = req.body.gameId;
    const player = req.body.gameTurn;
    const password = req.body.enteredPassword;

    console.log(`POST: /game/${gameId}/check-password ${JSON.stringify({ gameId, player, password })}`);

    db.all("SELECT * FROM games WHERE gameId = ?", [gameId], (err, game) => {
        if (err) {
            console.log(err);
            return res.send("Error loading game.");
        }

        switch(player) {
            case 'white':
            case 'w':
                if (password === game[0].whitePlayerPassword) {
                    return res.send({ status: 'success' });
                } 
                break;
            case 'black':
            case 'b':
                if (password === game[0].blackPlayerPassword) {
                    return res.send({ status: 'success' });
                }
                break;
            default:
                return res.send({ status: 'error' });           
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}!`);
});