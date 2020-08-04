import io from "socket.io-client"
import { SerializedTile } from "./Util/GlobalInterfaces"
import { Game } from "."
import { Civilization } from "./Civiliziations/Civilization"
import Unit from "./Entity/Unit"
import { GetUnitBuilder } from "./Builders/Units"
import UnitsJSON from "./json/units.json"
import { TileType } from "./Tile"

export default class NetworkManager {
    private socket: SocketIOClient.Socket
    private url = "http://localhost:4000/"

    constructor(private game: Game) {
        this.socket = io(this.url)
        this.socket.on("creategameerror", (error: string) => {
            game.ui.loginScreen.AppendToNotif(error)
        })

        this.socket.on("gameready", (civs: { civname: string, id: number }[]) => {
            for (const c in civs) {
                const civ = civs[c]
                if (civ.id === game.mainCiv.id) continue
                game.AddCiv(new Civilization(game, civ.civname, "yellow", civ.id))
            }

            const tiles = game.map.tilesArray.filter(t => t.type !== TileType.Woda)
            const tile = game.map.RandomItem(tiles)
            game.mainCiv.AddEntity(GetUnitBuilder(UnitsJSON[0], game.mainCiv, tile).Build())

            game.ui.loginScreen.Close()
            game.Start()
        })
        this.socket.on("joinedgame", (data: { map: SerializedTile[], id: number }) => {
            console.log(data.id)
            this.ReceiveMap(data.map)
            const civ = game.ui.loginScreen.pickedCiv
            game.mainCiv = new Civilization(game, civ.leader, civ.color, data.id)
        })
        this.socket.on("createunit", (id: number, pos: { x: number, y: number }, name: string) => this.AddUnit(id, pos, name))
        this.socket.on("setready", (id: number, val: boolean) => this.SetReady(id, val, false))
        this.socket.on("moveunit", (id: number, oldPos: { x: number, y: number }, newPos: { x: number, y: number }) => this.MoveUnit(id, oldPos, newPos, false))
    }

    private ReceiveMap(map: SerializedTile[]) {
        this.game.map.LoadMap(map)
    }
    CreateGame(players: number, code: string, map: SerializedTile[]) {
        if (!this.game.ui.loginScreen.pickedCiv) return
        this.socket.emit("creategame", { players, code, map, civname: this.game.ui.loginScreen.pickedCiv.civname })
    }
    JoinGame(code: string, pickedCiv: string) {
        this.socket.emit("joingame", code, pickedCiv)
    }
    CreateUnit(unit: Unit) {
        this.socket.emit("createunit", this.game.mainCiv.id, unit.tile.mapPos, unit.data.name)
    }
    AddUnit(id: number, pos: { x: number, y: number }, name: string) {
        console.log("dodaje")
        const civ = this.game.civilizations.find(t => t.id === id)
        const tile = this.game.map.tiles[pos.x][pos.y]
        civ.AddEntity(GetUnitBuilder(UnitsJSON.find(t => t.name === name), civ, tile).Build(), false)
    }
    MoveUnit(id: number, oldPos: { x: number, y: number }, newPos: { x: number, y: number }, send = true) {
        console.log(oldPos, newPos)
        if (send) this.socket.emit("moveunit", id, oldPos, newPos)
        else {
            console.log("ruszam sie", id)
            const oldTile = this.game.map.tiles[oldPos.x][oldPos.y]
            const newTile = this.game.map.tiles[newPos.x][newPos.y]
            const unit = this.game.civilizations.find(t => t.id === id).units.find(t => t.tile === oldTile)
            delete unit.tile.entity
            unit.tile = newTile
        }
    }
    SetReady(id: number, val: boolean, send = true) {
        try {
            if (send === true) this.socket.emit("setready", id, val)
            else if (id !== this.game.mainCiv.id) this.game.civilizations.find(t => t.id === id).ready = val
        } catch (e) { console.log("blad w", id, val, send) }
    }
}