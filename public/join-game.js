// Initialize the join game form
(function(document, blackPlayerHasUnsetPassword) {
    const gameId = document.location.href.split('/').at(4);

    if (!blackPlayerHasUnsetPassword) {
        alert('The black player has already set their password. You can no longer join this game.');
        window.location = `/game/${gameId}`;
    }

    document.getElementById('joinGameForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission

        let password = document.getElementById('pass').value;
        let confirmPassword = document.getElementById('confirmPass').value;
        console.log(`submitting check-password: gameId: ${gameId}, password: ${password}, confirmPassword: ${confirmPassword}`);

        fetch(`/game/${gameId}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gameId, password, confirmPassword }),
        })
        .then(response => response.json()) // Assuming server responds with json
        .then(data => {
            console.log(`check-password response: ${data.status}`); // Should be `success`
            if (data.status === 'success') {
                window.location = `/game/${gameId}`;
            } else if (data.status === 'error') {
                alert("Your password confirmation didn't match. Please try again.");
            }
        })
        .catch(error => {
            console.log(`Error submitting password: ${error}`);
        });
    });
})(document, blackPlayerHasUnsetPassword);