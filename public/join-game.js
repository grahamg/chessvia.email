// Initialize the join game form
(function(document) {
    const gameId = document.location.href.split('/').at(4);

    fetch(`/game/${gameId}/black-player-status`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        console.log(`black-password-status response: ${data.status}`);
        if (data.status === 'true') {
            alert('The black player has already accepted the invitation to this game.');
            window.location = `/`;
        } else if (data.status === 'error') {
            alert('The game you are trying to join does not exist.');
            window.location = '/';
        }
    });

    document.getElementById('joinGameForm').addEventListener('submit', function(event) {
        event.preventDefault();

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
        .then(response => response.json())
        .then(data => {
            console.log(`check-password response: ${data.status}`);
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
})(document);