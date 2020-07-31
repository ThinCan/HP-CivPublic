import Unit from "../Entity/Unit";
import City from "../Entity/City";
import { Game } from "..";
import { Entity } from "../Entity/Entity";
import { IResources, IData } from "../Util/GlobalInterfaces";

export class Civilization {
  static id = 0;

  ready = false;
  queue: Entity[] = [];
  units: Unit[] = [];
  cities: City[] = [];
  resources: IResources = {
    iron: 1000,
    stone: 1000,
    wood: 1000,
    money: 1000,
    horse: 1000,
    mineral: 0,
  };

  id: number;
  constructor(
    public game: Game,
    public name: string,
    public color: string,
    public main = false
  ) {
    this.id = Civilization.id++;
  }

  AddEntity(e: Entity) {
    if (e instanceof Unit) this.units.push(e);
    else if (e instanceof City) this.cities.push(e);

    if (this.main) e.Select();
  }
  RemoveEntity(e: Entity) {
    e.Deselect();
    delete e.tile.entity;
    if (e instanceof Unit) {
      this.units = this.units.filter((t) => t !== e);
    } else {
      this.cities = this.cities.filter((t) => t !== e);
      console.log("usuwam maisto");
    }
    this.queue = this.queue.filter((t) => t !== e);
  }

  NextTurn() {
    this.ready = false;

    const res = this.GetResourceIncome();
    for (const key in res) {
      if (key === "mineral") continue;
      //@ts-ignore
      this.resources[key] += res[key];
    }

    [...this.units, ...this.cities].forEach((e) => e.NextTurn());
  }
  NextAction() {
    if (this.queue.length === 0) {
      this.DeselectLastEntity();
      this.ready = true;
    } else {
      const e = this.queue.pop();
      if (this.main && e) e.Select();
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
  GetResourceIncome() {
    return this.cities.reduce(
      (p, c) => {
        const res = c.stats;
        for (const k in res) {
          //@ts-ignore
          if (!p[k]) p[k] = 0;
          //@ts-ignore
          p[k] += res[k];
        }

        return p;
      },
      { mineral: this.resources.mineral } as Partial<IData & IResources>
    );
  }
}
