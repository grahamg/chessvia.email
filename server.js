const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Create a transporter object using the default SMTP transport.
const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 25,
    secure: false,
    tls: {
        rejectUnauthorized: false
    }
});

// SQLite3 setup, create database if they don't already exist.
const db = new sqlite3.Database('./chessGames.db');

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
app.post('/game', (req, res) => {
    // Validate the request. If the request is invalid, return an error.
    if (!req.body.whitePlayerEmail || !req.body.blackPlayerEmail) {
        return res.send("Error saving game.");
    }

    if(req.body.whitePlayerPassword !== req.body.whitePlayerConfirmPassword) {
        return res.send("Passwords do not match for the white player.");
    }

    const gameId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // The black player's password isn't known yet, so set it to a dummy value.
    const blackPlayerPassword = 'Test';

    const saveGame = new Promise((resolve, reject) => {
        const stmt = db.prepare("INSERT INTO games VALUES (?, ?, ?, ?, ?, ?, ?)");
        stmt.run(gameId, req.body.whitePlayerName, req.body.whitePlayerEmail, req.body.whitePlayerPassword,
            req.body.blackPlayerName, req.body.blackPlayerEmail, blackPlayerPassword, (err) => {
                if (err) {
                    console.log(err);
                    reject("Error saving game.");
                } else {
                    console.log(`Game created under id: ${gameId}`);
                    resolve();
                }
        });
        stmt.finalize();
    });
    
    saveGame.then(() => {
        console.log("Attempting to send email...");
        return new Promise((resolve, reject) => {
            transporter.sendMail({
                from: 'noreply@chessvia.email',
                to: req.body.blackPlayerEmail,
                subject: `${req.body.whitePlayerName} has invited you to play a game of chess via email!`,
                text: `Hello ${req.body.blackPlayerName},\n/
                ${req.body.whitePlayerName} has invited you to join a chess game.\n/
                To accept the invitation, visit https://www.chessvia.email/${gameId}/join.\n/
                Before making your first move, you'll get a chance to set your own password for the game.\n/
                This prevents unauthorized clients from submitting moves on your behalf.\n/
                Please visit https://www.chessvia.email/ to learn more about this service.\n/
                Good Luck,\n\n/
                ChessVia.email Notification Robot`
            }, (err, info) => {
                if (err) {
                    console.log(err);
                    reject("Error sending initial game welcome email.");
                } else {
                    console.log("Initial game welcome email sent successfully.");
                    resolve();
                }
            });
        });
    }).then(() => {
        console.log(`Redirecting to /game/${gameId}`);
        res.redirect(`/game/${gameId}`);
    }).catch((err) => {
        console.log("Error caught in promise chain:", err);
        res.send(err);
    });
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
    let opposingPlayerEmail;

    // Get the opposing player's email address. They'll be notified that it's now their turn.
    switch(player) {
        case 'white':
        case 'w':
            opposingPlayerEmail = game[0].blackPlayerEmail;
            break;
        case 'black':
        case 'b':
            opposingPlayerEmail = game[0].whitePlayerEmail;
            break;
        default:
            return res.send({ status: 'error' });           
    }

    // Save the move to the database. It is assumed before this point that the move is valid and the
    // player has the correct password.
    const saveMove = new Promise((resolve, reject) => {
        const stmt = db.prepare("INSERT INTO moves (gameId, player, move) VALUES (?, ?, ?)");
        stmt.run(gameId, player, moveFromTo, (err) => {
            if (err) {
                console.log(err);
                reject("Error saving move.");
            } else {
                console.log("Move saved successfully.");
                resolve();
            }
        });
        stmt.finalize();
    });

    // Send an email to the opposing player with the game ID notifying them that it is their turn.
    saveMove.then(() => {
        const mailOptions = {
            from: 'noreply@chessvia.email',
            to: opposingPlayerEmail,
            subject: 'Your opponent has moved from ${move.from} to ${move.to}. It\'s your turn!',
            text: `Your opponent has moved from ${move.from} to ${move.to} so, it's now your turn.\
                You can access the game at https://www.chessvia.email/game/${gameId}.`
        };

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err);
                return res.send("Error sending notification email to opposing player letting them know it's their turn.");
            } else {
                console.log("Notification email sent successfully to opposing player letting them know it's their turn");
            }
        });
    }).then(() => {
        console.log("POST: " + JSON.stringify({ gameId, player, moveFromTo }));
        res.send({ status: 'saved' });
    }).catch((err) => {
        // Handle any errors that occurred during the process.
        console.log(err);
        res.send({ status: 'error' });
    });
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