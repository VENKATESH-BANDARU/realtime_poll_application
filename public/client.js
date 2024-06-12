const socket = io();

let username = prompt('Enter your username:');
socket.emit('setUsername', username);

document.getElementById('sendButton').addEventListener('click', () => {
    const messageInput = document.getElementById('chatInput');
    const message = messageInput.value;
    if (message.trim()) {
        socket.emit('sendMessage', message);
        messageInput.value = '';
    }
});

document.getElementById('chatInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        const message = event.target.value;
        if (message.trim()) {
            socket.emit('sendMessage', message);
            event.target.value = '';
        }
    } else {
        socket.emit('typing', username);
    }
});


let isMuted = false;

document.getElementById('muteButton').addEventListener('click', () => {
    isMuted = !isMuted;
    document.getElementById('muteButton').textContent = isMuted ? 'Unmute' : 'Mute';
});

socket.on('initialData', (data) => {
    const pollOptions = data.pollData.options;
    const pollVotes = data.pollData.votes;

    const pollContainer = document.getElementById('pollOptions');
    pollContainer.innerHTML = '';
    pollOptions.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = `${option} - ${pollVotes[index]} votes`;
        button.addEventListener('click', () => {
            socket.emit('vote', index);
        });
        pollContainer.appendChild(button);
    });

    updateChatMessages(data.chatMessages);
});

socket.on('updatePoll', (data) => {
    const pollContainer = document.getElementById('pollOptions');
    pollContainer.innerHTML = '';
    data.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = `${option} - ${data.votes[index]} votes`;
        button.addEventListener('click', () => {
            socket.emit('vote', index);
        });
        pollContainer.appendChild(button);
    });
});

socket.on('newMessage', (message) => {
    updateChatMessages([message]);
});

socket.on('updateMessages', (messages) => {
    updateChatMessages(messages, true);
});

socket.on('typing', (username) => {
    const typingIndicator = document.getElementById('typingIndicator');
    typingIndicator.textContent = `${username} is typing...`;
    setTimeout(() => {
        typingIndicator.textContent = '';
    }, 1000);
});

socket.on('voteStatus', (data) => {
    alert(data.message);
});

function updateChatMessages(messages, overwrite = false) {
    const chatContainer = document.getElementById('chatMessages');
    if (overwrite) {
        chatContainer.innerHTML = '';
    }
    messages.forEach((message) => {
        const messageDiv = document.createElement('div');

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        messageContent.innerHTML = `<strong>${message.user}</strong>: ${message.text}`;

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('edit');
        editButton.addEventListener('click', () => {
            const newText = prompt('Edit your message:', message.text);
            if (newText !== null) {
                socket.emit('editMessage', { id: message.id, newText });
            }
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete');
        deleteButton.addEventListener('click', () => {
            socket.emit('deleteMessage', message.id);
        });

        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);

        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(buttonContainer);
        chatContainer.appendChild(messageDiv);
    });

    if (!isMuted) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}
