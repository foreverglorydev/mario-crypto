"use strict";
// const { ethers } = require("ethers");
const controller = {};
let users = [];

const checkUser = (socketId) => {
    return users.find(user => user.socketId == socketId);
}
const getUTCtimes = () => {
    var d = new Date();
    var currentdate = ('' + d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate());
    return currentdate;
}
controller.login = async (data, socketId) => {
    const db = global.db;
    let accountdata = data;
    let time = getUTCtimes();

    let result_count = await db.query(
        "SELECT id FROM users WHERE address = '" + accountdata.account + "' AND date = '" + time + "'"
    );
    var result = await db.query("INSERT INTO users (address, date, level, socketID) VALUES('" + accountdata.account + "','" + getUTCtimes() + "',1,'" + socketId + "')");
    let newUser = {};
    newUser.socketId = socketId;
    newUser.address = accountdata.account;
    newUser.coin = 0;
    newUser.level = 1;
    users.push(newUser);
    console.log('users', users)
    return {
        success: 1,
    };
};

controller.disconnect = (_socketId) => {
    users = users.filter((user) => user.socketId != _socketId);
};

controller.addCoin = async (data, socketId) => {
    var user = checkUser(socketId);
    if (!user) throw new Error("Invalid request");
    user.coin += 1;
    const db = global.db;
    await db.query(
        "UPDATE users SET coins = '" +
        user.coin +
        "' WHERE socketID = '" +
        user.socketId +
        "'"
    );
    return user;
};
controller.addLevel = async (data, socketId) => {
    var user = checkUser(socketId);
    if (!user) throw new Error("Invalid request");
    user.level += 1;
    const db = global.db;
    await db.query(
        "UPDATE users SET level = '" +
        user.level +
        "' WHERE socketId = '" +
        user.socketId +
        "'"
    );
    return user;
};
controller.rewards = async (data, socketId) => {
    var user = checkUser(socketId);
    if (!user) throw new Error("Invalid request");
    const db = global.db;
    var user_result = await db.query("SELECT * FROM users WHERE socketID = '" + socketId + "'");
    return user_result;
};

controller.emit = (socket) => {
    socket.emit("userslist", { users });
};

module.exports = {
    controller: controller,
    users: users,
};