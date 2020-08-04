const express = require("express");
const app = express();
const ioserver = require("http").createServer(app);
const io = require("socket.io")(ioserver);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + "/../dist/"));

app.listen(3500)


const rooms = new Map()
const maps = new Map()
const ids = new Map()

io.on("connection", (socket) => {
  socket.on("creategame", ({ players, code, map, civname }) => {
    if (rooms.has(code)) { socket.emit("creategameerror", "Pokój już istnieje"); return }
    console.log("tworze pokoj o id: " + code)
    socket.join(code)
    rooms.set(code, { sockets: [socket.id], civs: [{ civname, id: 0 }], players })
    maps.set(code, map)
    ids.set(code, 0)
    socket.emit("joinedgame", { map: maps.get(code), id: ids.get(code) })
    ids.set(code, ids.get(code) + 1)

    if (rooms.get(code).sockets.length === rooms.get(code).players)
      socket.emit("gameready", rooms.get(code).civs)
  })
  socket.on("joingame", (code, civname) => {
    if (!rooms.has(code)) return
    if (rooms.get(code).sockets.length === rooms.get(code).players) return;
    socket.join(code)
    socket.emit("joinedgame", { map: maps.get(code), id: ids.get(code) })
    rooms.get(code).sockets.push(socket.id)
    rooms.get(code).civs.push({ civname, id: ids.get(code) })

    if (rooms.get(code).sockets.length === rooms.get(code).players)
      io.in(code).emit("gameready", rooms.get(code).civs)
    ids.set(code, ids.get(code) + 1)
  })
  socket.on("createunit", (id, pos, name) => {
    const code = [...rooms.keys()].find(t => rooms.get(t).sockets.includes(socket.id))
    console.log("wysylam", code)
    socket.to(code).emit("createunit", id, pos, name)
  })
  socket.on("setready", (id, val) => {
    const code = [...rooms.keys()].find(t => rooms.get(t).sockets.includes(socket.id))
    socket.to(code).emit("setready", id, val)
  })
  socket.on("moveunit", (id, op, np) => {
    const code = [...rooms.keys()].find(t => rooms.get(t).sockets.includes(socket.id))
    console.log(op, np)
    socket.to(code).emit("moveunit", id, op, np)
  })

  socket.on("disconnecting", () => {
    const srooms = Object.keys(socket.rooms)
    for (const room of srooms) {
      if (!rooms.get(room)) continue;
      if (rooms.get(room).sockets.length <= 1) {
        console.log("usuwam pokoj", room)
        rooms.delete(room)
        maps.delete(room)
        ids.delete(room)
        console.log("pozostale pokoje: ", rooms.keys())
      }
    }
  })
});
io.listen(4000);
