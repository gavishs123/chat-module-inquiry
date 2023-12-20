const express = require("express");
const app = express();
const dateTime = require("simple-datetime-formater");
const bodyParser = require("body-parser");
const chatRouter = require("./route/chatroute");
const loginRouter = require("./route/loginRoute");

const http = require("http").Server(app);

const io = require("socket.io");

const port = 5000;

app.use(bodyParser.json());

app.use("/chats", chatRouter);
app.use("/login", loginRouter);

app.use(express.static(__dirname + "/public"));

const socketIo = io(http);

const Chat = require("./models/Chat");
const connect = require("./dbconnect");


function generateUserName() {
  const name = ['John', 'Jane', 'Alex', 'Emily', 'Chris', 'Sophie', 'David', 'Emma', 'Michael', 'Olivia', 'Daniel', 'Grace'];
  const surname = ['son', 'ston', 'ford', 'shire', 'ton', 'field', 'ford', 'well', 'wood', 'dale', 'manor', 'brook'];

  const randomName = name[Math.floor(Math.random() * name.length)];
  const randomSurname = surname[Math.floor(Math.random() * surname.length)];

  return randomName + " " + randomSurname;
}

class ChatServer {
  constructor(socketIo, connect, Chat) {
    this.socketIo = socketIo;
    this.connect = connect;
    this.Chat = Chat;
    this.UsersArray = [];

    this.handleUserConnection = this.handleUserConnection.bind(this);
    this.handleDisconnect = this.handleDisconnect.bind(this);
    this.handleTyping = this.handleTyping.bind(this);
    this.handleStopTyping = this.handleStopTyping.bind(this);
    this.handleChatMessage = this.handleChatMessage.bind(this);

    this.socketIo.on('connection', this.handleUserConnection);
  }

  // generateUserName() {
  //   // Implement your generateUserName logic here
  //   // For now, returning a placeholder
  //   return 'User' + Math.floor(Math.random() * 1000);
  // }

  async handleUserConnection(socket) {
    const userName = generateUserName();
    const user = {
      socketId: socket.id,
      socketName: userName,
    };

    this.UsersArray.push(user);

    this.socketIo.emit('userlist', this.UsersArray);

    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    socket.on('typing', (data) => {
      this.handleTyping(socket, data);
    });

    socket.on('stopTyping', () => {
      this.handleStopTyping(socket);
    });

    socket.on('chat message', async (msg) => {
      this.handleChatMessage(socket, userName, msg);
    });
  }

  handleDisconnect(socket) {
    const index = this.UsersArray.findIndex((e) => e.socketId === socket.id);
    if (index !== -1) {
      this.UsersArray.splice(index, 1);
    }

    this.socketIo.emit('userlist', this.UsersArray);
  }

  handleTyping(socket, data) {
    socket.broadcast.emit('notifyTyping', {
      user: data.user,
      message: data.message,
    });
  }

  handleStopTyping(socket) {
    socket.broadcast.emit('notifyStopTyping');
  }

  async handleChatMessage(socket, userName, msg) {
    socket.broadcast.emit('received', { message: msg, name: userName });

    try {
      const db = await this.connect;
      console.log('Connected correctly to the server');
      const chatMessage = new this.Chat({ message: msg, sender: userName });
      await chatMessage.save();
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  }
}

const chatServer = new ChatServer(socketIo, connect, Chat);


http.listen(port, () => {
  console.log("Running on Port: " + port);
});
