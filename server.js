const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;

const pollData = {
    options: ['Cricket', 'Volleyball', 'Football', 'Badminton'],
    votes: [0, 0, 0, 0]
};

let chatMessages = [];
let users = {};
let votes = {};

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.emit('initialData', { pollData, chatMessages });

    socket.on('setUsername', (username) => {
        users[socket.id] = username;
        votes[username] = false;
    });

    socket.on('vote', (index) => {
        const username = users[socket.id];
        if (votes[username]) {
            socket.emit('voteStatus', { message: 'Your vote has already been submitted.' });
        } else {
            pollData.votes[index]++;
            votes[username] = true;
            io.emit('updatePoll', pollData);
        }
    });

    socket.on('sendMessage', (data) => {
        const message = { id: uuidv4(), user: users[socket.id], text: data };
        chatMessages.push(message);
        io.emit('newMessage', message);
    });

    socket.on('editMessage', (data) => {
        const { id, newText } = data;
        const message = chatMessages.find((msg) => msg.id === id);
        if (message) {
            message.text = newText;
            io.emit('updateMessages', chatMessages);
        }
    });

    socket.on('deleteMessage', (id) => {
        chatMessages = chatMessages.filter((msg) => msg.id !== id);
        io.emit('updateMessages', chatMessages);
    });

    socket.on('typing', (username) => {
        socket.broadcast.emit('typing', username);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete users[socket.id];
    });
});

server.listen(PORT, () => {
    console.log('Server running on port 3000');
});