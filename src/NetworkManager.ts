import io from "socket.io-client"
import { SerializedTile, SerializedCity, IPickedCivilization } from "./Util/GlobalInterfaces"
import { Game } from "."
import { GetUnitBuilder } from "./Builders/Units"
import UnitsJSON from "./json/units.json"
import { TileType } from "./Tile"
import City from "./Entity/City"
import { GetCivilization } from "./Civiliziations/CivDecorator"

export default class NetworkManager {
    private socket: SocketIOClient.Socket
    private url = "http://localhost:4000/"
    private roomcode: string

    constructor(private game: Game) {
        this.socket = io(this.url)
        this.socket.on("gameready", async (id: number, map: SerializedTile[], civs: IPickedCivilization[], code: string, ciociaCivPos: any) => {
            this.roomcode = code
            const pickedCiv = game.ui.loginScreen.pickedCiv
            game.mainCiv = GetCivilization(id, pickedCiv.civname, game)
            for (const c of civs) {
                game.AddCiv(GetCivilization(c.id, c.civname, game))
            }

            game.map.LoadMap(map)

            const tiles = game.map.tilesArray.filter(t => t.type !== TileType.Woda)
            const tile = game.map.RandomItem(tiles)
            GetUnitBuilder(UnitsJSON[0], tile, game.mainCiv).Build()

            const ctile = this.game.map.tiles[ciociaCivPos.x][ciociaCivPos.y]
            this.game.ciociaCiv = GetCivilization(-1, "Ciocia", this.game)
            this.game.ciociaCiv.AddEntity(new City(ctile, this.game.assets.MiastoCiociaZamkniete, this.game.ciociaCiv))


            game.ui.loginScreen.Close()
            game.Start()
        })

        this.socket.on("moveunit", (id: number, oldPos: { x: number, y: number }, newPos: { x: number, y: number }) => this.MoveUnit(id, oldPos, newPos, false))
        this.socket.on("turn", () => this.NextTurn())
        this.socket.on("createunit", (id: number, pos: { x: number, y: number }, name: string) => this.CreateUnit(id, pos, name, false))
        this.socket.on("createcity", (id: number, pos: { x: number, y: number }) => this.CreateCity(id, pos, false))
        this.socket.on("removeunit", (id: number, pos: { x: number, y: number }) => this.RemoveUnit(id, pos, false))
        this.socket.on("removecity", (id: number, pos: { x: number, y: number }) => this.RemoveCity(id, pos, false))
        this.socket.on("receivedamage", (id: number, pos: { x: number, y: number }, value: number) => this.ReceiveDamage(id, pos, value, false))
        this.socket.on("updatetile", (data: SerializedTile) => this.UpdateTile(data, false))
        this.socket.on("updatecity", (data: SerializedCity) => this.UpdateCity(data, false))
        this.socket.on("sendlog", (text: string) => game.ui.appendToActionLog(text))
    }

    CreateGame(players: number, code: string, map: SerializedTile[]) {
        if (!this.game.ui.loginScreen.pickedCiv) return
        this.socket.emit("creategame", { players, code, map, civname: this.game.ui.loginScreen.pickedCiv.civname })

        const tiles = this.game.map.tilesArray.filter(t => t.type !== TileType.Woda && !t.modifier)
        const tile = this.game.map.RandomItem(tiles)
        this.socket.emit("setciociacity", code, tile.mapPos)
    }
    JoinGame(code: string, pickedCiv: string) { this.socket.emit("joingame", code, pickedCiv) }

    CreateUnit(id: number, pos: { x: number, y: number }, name: string, send = true) {
        if (send) { this.socket.emit("createunit", this.roomcode, this.game.mainCiv.id, pos, name); }
        else {
            const civ = this.game.civilizations.find(t => t.id === id);
            const tile = this.game.map.tiles[pos.x][pos.y]
            GetUnitBuilder(UnitsJSON.find(t => t.name === name), tile, civ).Build(false)
        }
    }
    CreateCity(id: number, pos: { x: number, y: number }, send = true) {
        if (send) { this.socket.emit("createcity", this.roomcode, this.game.mainCiv.id, pos) }
        else {
            const civ = this.game.civilizations.find(t => t.id === id);
            const tile = this.game.map.tiles[pos.x][pos.y]
            civ.AddEntity(new City(tile, this.game.assets.Miasto, civ), false)
        }
    }
    RemoveUnit(id: number, pos: { x: number, y: number }, send = true) {
        if (send) this.socket.emit("removeunit", this.roomcode, this.game.mainCiv.id, pos)
        else {
            const civ = this.game.civilizations.find(t => t.id === id);
            const tile = this.game.map.tiles[pos.x][pos.y]
            civ.RemoveEntity(tile.entity, false)
        }
    }
    RemoveCity(id: number, pos: { x: number, y: number }, send = true) {
        if (send) this.socket.emit("removecity", this.roomcode, this.game.mainCiv.id, pos)
        else {
            const civ = this.game.civilizations.find(t => t.id === id);
            const tile = this.game.map.tiles[pos.x][pos.y]
            civ.RemoveEntity(tile.city, false)
        }
    }
    MoveUnit(id: number, oldPos: { x: number, y: number }, newPos: { x: number, y: number }, send = true) {
        if (send) this.socket.emit("moveunit", this.roomcode, id, oldPos, newPos)
        else {
            const oldTile = this.game.map.tiles[oldPos.x][oldPos.y]
            const newTile = this.game.map.tiles[newPos.x][newPos.y]
            const unit = this.game.civilizations.find(t => t.id === id).units.find(t => t.tile === oldTile)
            delete unit.tile.entity
            unit.tile = newTile
            newTile.entity = unit
        }
    }
    SetReady(id: number, val: boolean) {
        this.socket.emit("setready", this.roomcode, id, val)
    }
    NextTurn() {
        this.game.NextTurn()
    }
    ReceiveDamage(id: number, pos: { x: number, y: number }, value: number, send = true) {
        if (send) this.socket.emit("receivedamage", this.roomcode, id, pos, value)
        else {
            const unit = this.game.map.tiles[pos.x][pos.y].entity
            unit.ReceiveDamage(value, false)
        }
    }
    UpdateTile(data: SerializedTile, send = true) {
        if (send) this.socket.emit("updatetile", this.roomcode, data)
        else this.game.map.UpdateTileData(data)
    }
    UpdateCity(data: SerializedCity, send = true) {
        if (send) this.socket.emit("updatecity", this.roomcode, data)
        else {
            this.game.map.tiles[data.mapPos.x][data.mapPos.y].city.UpdateData(data)
        }
    }
    SendLog(text: string, toSelf = false) {
        console.log("wysylam")
        this.socket.emit("sendlog", this.roomcode, text)
        if (toSelf) this.game.ui.appendToActionLog(text)
    }
}