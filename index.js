const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const expressWs = require("express-ws");
const config = require("./config");
const users = require("./app/users");
const Message = require("./models/Message");
const User = require("./models/User");
const port = 8003;
expressWs(app);

const activeConnections = {};
let activeUsers = [];

app.ws("/chat", async (ws, req) => {
    const token = req.query.token;
    const user = await User.findOne({token:token});
    const id = user.username;
    console.log('client connected! id=', id);
    activeConnections[id] = ws;
    activeUsers.push(id)

    ws.on('message', async (msg) => {
        const decodedMessage = JSON.parse(msg);
        switch (decodedMessage.type) {
            case 'GET_ALL_MESSAGES':
                const messagesData = await Message.find().populate('user','username');
                if (messagesData) {
                    ws.send(JSON.stringify({type: "ALL_MESSAGES", messages: messagesData.slice(-30)}));
                }
                break;
            case 'GET_ALL_CONNECTIONS':
                    ws.send(JSON.stringify({type: "ALL_CONNECTIONS", connections: activeUsers}));
                break;
            case 'CREATE_MESSAGE':
                Object.keys(activeConnections).forEach(connId => {
                    const conn = activeConnections[connId];

                    const messageData = {
                        user:user._id,
                        message: decodedMessage.message
                    };

                    const message = new Message(messageData);
                    try {
                         message.save();
                    } catch (e) {
                         throw e;
                    }

                    conn.send(JSON.stringify({
                        type: 'NEW_MESSAGE',
                        message: decodedMessage.message,
                        user: user
                    }));
                });
                break;
            // case 'CREATE_USERS':
            //     Object.keys(activeConnections).forEach(userId => {
            //         const users = activeConnections[userId];
            //
            //         users.send(JSON.stringify({
            //             type: 'NEW_USER',
            //             user
            //         }));
            //     });
            //     break;
            default:
                console.log('Unknown message type:', decodedMessage.type);
        }
    });

    ws.on('close', (msg) => {
        console.log('client disconnected! id=', id);
        delete activeConnections[id];

        activeUsers = activeUsers.filter(item => {
            return item !== id
        })
    });
});

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const run = async () => {
    await mongoose.connect(config.db.url + "/" + config.db.name, {useNewUrlParser: true, autoIndex: true});

    app.use("/users", users);

    console.log("Connected to mongo DB");
};

run().catch(console.log);

app.listen(port, () => {
    console.log("Server started at http://localhost:8003");
});