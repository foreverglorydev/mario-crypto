require('dotenv').config()
var bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const express = require("express");
const app = express();
const http = require('http').createServer(app);
const https = require('https');
const { Server } = require("socket.io");
const io = new Server(http);

var cors = require("cors");

const controller = require("./controllers/mycontrollers").controller;
let sockets = [];
const PORT = process.env.PORT || 80
const HTTPSPORT = process.env.HTTPS_PORT || 443

const fileKey = __dirname + '/certs/privkey.pem'
const filePem = __dirname + '/certs/cert.pem'
let httpsServer = null
let ioHttps = null
if (fs.existsSync(fileKey) && fs.existsSync(filePem)) {
    const key = fs.readFileSync(fileKey, 'utf8')
    const cert = fs.readFileSync(filePem, 'utf8')
    const options = { cert, key }
    httpsServer = https.createServer(options, app)
    ioHttps = new Server(httpsServer);
}

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.options("/*", function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, Content-Length, X-Requested-With"
    );
    res.send(200);
});

const { connectDB } = require("./db");
db = connectDB({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
});

global.sql = db;

const rewards = require("./blockchainApis");

setInterval(() => {
    if (sockets.length > 0) {
        sockets.map((_socket) => {
            controller.emit(_socket);
        });
    }
}, 500);

// Implement socket functionality
const onConnection = (socket) => {
    console.log("socket connected: " + socket.id);
    socket.on("disconnect", function () {
        console.log("disconnected");
        controller.disconnect(socket.id);
        sockets = sockets.filter((_socket) => {
            socket.id != _socket.id;
        });
        console.log('sockets  -  ', ...sockets);
        console.log('socket length   -   ', sockets.length);
    });
    socket.on("play", async (data) => {
        try {
            console.log(data);
            var r = await controller.login(data, socket.id);
            if (r.success == 1) {
                sockets.push(socket);
            }
            socket.emit('playResponse', { resdata: r.success });
        } catch (err) {
        }
    });
    socket.on("addcoin", async (data) => {
        try {
            var r = await controller.addCoin(data, socket.id);
        } catch (err) {
        }
    });
    socket.on("addlevel", async (data) => {
        try {
            var r = await controller.addLevel(data, socket.id);
        } catch (err) {
        }
    });
    socket.on("receiveReward", async (data) => {
        try {
            var r = await controller.rewards(data, socket.id);
            if (r.level != 1) {
                var result = await rewards(r[0], 0.25, data.price);
                socket.emit('receiveRewardResponse', { result });
            }
            else {
                socket.emit('receiveRewardResponse', { result: false });
            }
            await controller.disconnect(socket.id);
        } catch (err) {

        }
    });
}

