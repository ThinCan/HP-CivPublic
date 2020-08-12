const express = require("express");
const app = express();
const ioserver = require("http").createServer(app);
const io = require("socket.io")(ioserver);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname + "/../dist/"));

app.listen(3500)


const rooms = new Map()

function Room(code, map, playerCount) {
  this.map = map
  this.civs = []
  this.sockets = new Map()
  this.code = code
  this.playerCount = playerCount
  this.id = 0
  this.started = false
}

Room.prototype.Join = function (socket, civname) {
  socket.join(this.code)
  this.sockets.set(this.id, socket)
  this.civs.push({ civname, id: this.id++, ready: false })
  this.Start()
}
Room.prototype.Start = function () {
  if (this.civs.length !== this.playerCount) return;
  this.started = true

  for (const civ of this.civs) {
    io.to(this.sockets.get(civ.id).id).emit("gameready", civ.id, this.map, this.civs.filter(t => t.id !== civ.id), this.code)
  }
}

io.on("connection", (socket) => {

  socket.on("creategame", ({ players, code, map, civname }) => {
    if (rooms.has(code)) return;
    console.log(code)
    rooms.set(code, new Room(code, map, players))
    rooms.get(code).Join(socket, civname)
  })
  socket.on("joingame", (code, civname) => {
    if (!rooms.has(code) || rooms.get(code).started) return
    rooms.get(code).Join(socket, civname)
  })

  socket.on("createunit", (code, civid, unitpos, unitname) => {
    console.log("Tworze jednostke ", unitname)
    socket.to(code).emit("createunit", civid, unitpos, unitname)
  })
  socket.on("createcity", (code, civid, unitpos) => {
    console.log("Tworze Miasto")
    socket.to(code).emit("createcity", civid, unitpos)
  })
  socket.on("removeunit", (code, civid, unitpos) => {
    console.log("Usuwam jednostke ")
    socket.to(code).emit("removeunit", civid, unitpos)
  })
  socket.on("removecity", (code, civid, unitpos) => {
    console.log("Usuwam miasto")
    socket.to(code).emit("removecity", civid, unitpos)
  })
  socket.on("setready", (code, id, val) => {
    try {
      const civ = rooms.get(code).civs.find(t => t.id === id)
      civ.ready = val
      if (rooms.get(code).civs.every(t => t.ready)) io.to(code).emit("turn")
    } catch (e) {
      console.error(`Nie mozna ustawic wartosci ready cywilizacji o id: ${id} i kodzie: ${code}`)
    }
  })
  socket.on("moveunit", (code, civid, oldPos, newPos) => {
    socket.to(code).emit("moveunit", civid, oldPos, newPos)
  })

  socket.on("receivedamage", (code, civid, pos, value) => {
    socket.to(code).emit("receivedamage", civid, pos, value)
  })
  socket.on("updatetile", (code, data) => {
    socket.to(code).emit("updatetile", data)
  })
  socket.on("updatecity", (code, data) => {
    socket.to(code).emit("updatecity", data)
  })
  socket.on("setciociacity", (code, pos) => {
    socket.to(code).emit("setciociacity", pos)
  })


  socket.on("disconnecting", () => {

    const srooms = Object.keys(socket.rooms)
    for (const room of srooms) {
      if (!rooms.get(room)) continue;
      rooms.get(room).id--
      if (rooms.get(room).id === 0) {
        console.log("usuwam pokoj", room)
        rooms.delete(room)
        console.log("pozostale pokoje: ", rooms.keys())
      }
    }
  })
});
io.listen(4000);
