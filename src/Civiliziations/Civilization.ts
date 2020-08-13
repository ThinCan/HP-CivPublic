import Unit from "../Entity/Unit";
import City from "../Entity/City";
import { Game } from "..";
import { Entity } from "../Entity/Entity";
import { IResources } from "../Util/GlobalInterfaces";
import { ResourceMap } from "../Util/ResourceMap";

function addEntityDec(prot: any, name: string, desc: PropertyDescriptor) {
  const ori = desc.value
  desc.value = function (e: Entity, send = true) {
    if (send && e.civ.game.mainCiv && e.civ.id === e.civ.game.mainCiv.id) {
      if (e instanceof Unit) this.game.network.CreateUnit(this.id, e.tile.mapPos, e.data.name)
      else if (e instanceof City) this.game.network.CreateCity(this.id, e.tile.mapPos)
    }
    return (<Function>ori).call(this, e, send)
  }
}
function removeEntityDec(prot: any, name: string, desc: PropertyDescriptor) {
  const ori = desc.value
  desc.value = function (e: Entity, send = true) {

    if (send) {
      if (e instanceof Unit) this.game.network.RemoveUnit(this.id, e.tile.mapPos)
      else if (e instanceof City) this.game.network.RemoveCity(this.id, e.tile.mapPos)
    }

    return (<Function>ori).call(this, e, send)
  }
}

export abstract class Civilization {
  private _ready = false;
  queue: Entity[] = [];

  units: Unit[] = [];
  cities: City[] = [];

  resources = new ResourceMap<IResources>({
    iron: 1000,
    stone: 1000,
    wood: 1000,
    money: 1000,
    horse: 1000,
    mineral: 1,
  });


  constructor(
    public game: Game,
    public name: string,
    public color: string,
    public id: number
  ) { }

  @addEntityDec
  AddEntity(e: Entity, broadcast = true) {
    console.log(e)
    if (e instanceof Unit) { this.units.push(e); }
    else if (e instanceof City) { this.cities.push(e); }
    this.queue.push(e)
  }

  @removeEntityDec
  RemoveEntity(e: Entity, broadcast = true) {
    e?.Deselect();
    e.tile.entity = undefined
    if (e instanceof Unit) {
      this.units = this.units.filter((t) => t !== e);
    } else {
      this.cities = this.cities.filter((t) => t !== e);
    }
    this.queue = this.queue.filter((t) => t !== e);
  }

  NextTurn(select = true) {
    if (this.cities.length === 0 && this.units.length === 0) this.ready = true
    else this.ready = false;
    this.GatherResourcesFromCities();

    [...this.units, ...this.cities].forEach((e) => e.NextTurn(select));
  }
  NextAction() {
    if (this.queue.length === 0) {
      this.DeselectLastEntity();
      this.ready = true;
    } else {
      this.queue.pop()?.Select()
    }
  }
  Update() {
    for (let i = 0; i < this.cities.length; i++) this.cities[i].Update();
    for (let i = 0; i < this.units.length; i++) this.units[i].Update();
  }
  RemoveFromQueue(e: Entity) {
    this.queue = this.queue.filter((t) => t !== e);
  }
  DeselectLastEntity() {
    this.units.find((u) => u.selected)?.Deselect();
    this.cities.find((u) => u.selected)?.Deselect();
  }
  private GatherResourcesFromCities() {
    for (const city of this.cities) {
      for (const [k, v] of city.resourcesProduced.Entries()) {
        this.resources.Add(k, v)
      }
    }
  }
  public GetResourcesIncome() {
    const res = new ResourceMap<IResources>()
    for (const city of this.cities) {
      for (const [k, v] of city.resourcesProduced.Entries()) {
        res.Add(k, v)
      }
    }
    return res.ToObject()
  }
  set ready(val: boolean) {
    this._ready = val
    this.game.network.SetReady(this.id, this.ready)
  }
  get ready() { return this._ready }
}
