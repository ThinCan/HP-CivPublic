import Tile, { TileType } from "../Tile";
import { Entity } from "./Entity";
import { Civilization } from "../Civiliziations/Civilization";
import { IUnitJson } from "../Util/GlobalInterfaces";

export interface IUnitAction {
  execute: () => void;
  img: string;
  desc: string;
  id?: number;
}

function moveDecorator(unit: Unit, name: string, desc: PropertyDescriptor) {
  const original = desc.value
  desc.value = function (...args: any[]) {
    const _this = this as Unit
    const oldTile = _this.tile
    this.civ.game.network.MoveUnit(this.civ.id, oldTile.mapPos, args[0].mapPos);
    (<Function>original).apply(this, args)
  }
}
function damageDecorator(unit: Unit, name: string, desc: PropertyDescriptor) {
  const original = desc.value
  desc.value = function (value: number, send = true) {
    const _this = this as Unit
    if (send)
      this.civ.game.network.ReceiveDamage(this.civ.id, _this.tile.mapPos, value);
    (<Function>original).call(this, value, send)
  }
}

export default class Unit extends Entity {
  static walkingRange = 2;

  private _actions: IUnitAction[] = [];
  additionalActionsCallback: (tile: Tile) => IUnitAction[];

  walkingRange = 2;

  readonly fullHealth: number;
  private _health: number;
  defense: number;
  attack: number;

  tilesInRange: globalThis.Map<Tile, number>;

  private _actionTiles: Tile[] = [];
  tileAction: (tile: Tile) => void;

  // used by, for example worker to construct mines in 3 turns
  action: { turns: number; execute: () => void };

  constructor(
    tile: Tile,
    img: HTMLImageElement,
    civ: Civilization,
    public data: IUnitJson
  ) {
    super(tile, img, civ);
    tile.entity = this;
    this._health = data.health;
    this.fullHealth = data.health;
    this.defense = data.defense;
    this.attack = data.attack;
  }
  Update() {
    super.Update();

    const c = this.map.c;
    c.fillStyle = "black";

    c.font = "30px Arial";

    const x = this.pos.x + this.pos.size / 4,
      y = this.pos.y - 30,
      w = Tile.sizet,
      h = 30;

    c.fillRect(x, y, w, h);
    c.fillStyle = "white";
    c.textAlign = "left";
    c.fillText(`${this.health}/${this.fullHealth}`, x, y + 30, w);
  }

  @moveDecorator
  Move(tile: Tile) {
    if (tile.city && tile.city.civ !== this.civ) {
      const city = tile.city;
      city.civ.RemoveEntity(city);
      city.civ = this.civ;
      city.civ.AddEntity(city);
    }

    delete this.tile.entity;
    this.tile = tile;
    tile.entity = this;
    this.walkingRange -= this.tilesInRange.get(tile);

    this.Deselect();

    if (this.walkingRange <= 0) {
      this.civ.RemoveFromQueue(this);
      this.civ.NextAction();
    } else this.Select();

    this.action && delete this.action;
  }
  OnTurn() {
    this.walkingRange = Unit.walkingRange;

    this.action && --this.action.turns === 0
      ? (() => {
        this.action.execute();
        delete this.action;
      })()
      : null;
  }

  isFree() {
    return this.walkingRange > 0;
  }

  Select() {
    if (this.map.game.mainCiv.id !== this.civ.id) return
    if (this.selected && this.tile.city) {
      this.tile.city.Select();
      return;
    }
    this.civ.DeselectLastEntity();
    this.map.Focus(this.pos);
    this.map.game.ui.ShowUnit(this);

    this.tilesInRange = this.TilesInWalkingRange();

    [...this.tilesInRange.keys()].forEach((e) =>
      e.Select({ color: "orange", entity: this })
    );
    this.selected = true;
  }

  Deselect() {
    if (this.tilesInRange)
      [...this.tilesInRange.keys()].forEach((e) => e.Deselect());
    delete this.tilesInRange;
    this.selected = false;
    this.actionTiles.forEach((t) => t.Deselect());
    this.map.game.ui.HideUnit();
  }

  TilesInWalkingRange() {
    const resmap: globalThis.Map<Tile, number> = new globalThis.Map();

    const Sum = (total: number = 0, tile: Tile = this.tile) => {
      if (tile.type === TileType.Woda) return;

      if (tile.entity && tile.entity !== this) return;
      if (tile.city && tile.city.civ !== this.civ && tile.city.defense > 0)
        return;

      if (resmap.has(tile) && total >= resmap.get(tile)) return;
      if (total > this.walkingRange) return;

      if (tile !== this.tile) resmap.set(tile, total);
      for (const adj of tile.GetAdj()) {
        Sum(total + tile.weight, adj);
      }
    };
    Sum();
    return resmap;
  }
  AcceptTile(tile: Tile) {
    if (this.actionTiles.includes(tile)) this.tileAction(tile);
    else this.Move(tile);

    this.actionTiles.splice(0).forEach((t) => t.Deselect());
  }
  SelectActionsTiles(tiles: Tile[], color: string) {
    this._actionTiles = tiles;
    tiles.forEach((t) => t.Select({ entity: this, color }));
  }

  @damageDecorator
  ReceiveDamage(amount: number, send = true) {
    this._health -= +(amount / this.defense).toFixed(2);
    if (this.health <= 0) this.civ.RemoveEntity(this);
  }
  get actions() {
    const additionalActions = this.additionalActionsCallback?.(this.tile) || [];
    return [...this._actions, ...additionalActions];
  }
  set actions(v: IUnitAction[]) {
    this._actions = v;
  }
  get actionTiles() {
    return this._actionTiles;
  }
  get health() {
    return this._health;
  }
}
