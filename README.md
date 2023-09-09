# Chess Web Application

A web application that allows two players to play chess. Built with Node.js, Express, chessboard.js, and chess.js. Each move is saved to an SQLite database.

## Features

- Interactive chessboard using `chessboard.js`.
- Game logic handled by `chess.js`.
- Moves saved to SQLite database.
- Backend powered by Express.

## Getting Started

### Prerequisites

- Ensure you have Node.js and npm installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd path-to-your-project
   ```

3. Install the required packages:
   ```bash
   npm install
   ```

4. Start the server:
   ```bash
   node server.js
   ```

5. Open your browser and navigate to `http://localhost:3000` to start playing.

## Usage

- Make moves on the chessboard.
- Each move will be automatically saved to the SQLite database with a game ID.

## Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -m 'Add YourFeature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Open a pull request.

## License

This project is licensed under the MIT License.
