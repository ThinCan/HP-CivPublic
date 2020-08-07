import { IBuilder, Production, Building } from "../Builders/Builder";
import { Civilization } from "../Civiliziations/Civilization";
import BuildingsJSON from "../json/citybuilding.json";
import UnitsJSON from "../json/units.json";
import Tile from "../Tile";
import { IData, IResources, IProduct, SerializedCity } from "../Util/GlobalInterfaces";
import { Entity } from "./Entity";
import { GetUnitBuilder } from "../Builders/Units";
import { GetBuildingBuilder } from "../Builders/Buildings";

export type TAssignedCitizen = IResources & { prod: number; food: number };

function UpdateDec(city: City, name: string, dec: PropertyDescriptor) {
  const ori = dec.value

  dec.value = function (...args: any[]) {
    (this as City).civ.game.network.UpdateCity(this.Serialize());
    (ori as Function).apply(this, args)
  }
}

export default class City extends Entity {
  static TimeToGrow = 5;
  private _stats = { pop: 1, food: 6 };

  name: string;
  tiles: Tile[] = [];
  timeLeftToGrow: number = 0;
  growthFactor = 0;
  maxCitizens = this._stats.pop;
  private _defense: number = 30;

  production: Production;
  built: Building[] = [];

  private _available: IProduct[] = [
    BuildingsJSON[0],
    UnitsJSON[0],
    UnitsJSON[1],
    BuildingsJSON.find((e) => e.name === "Kamieniołom"),
  ];

  assignedCitizens: TAssignedCitizen = {
    prod: 0,
    food: 0,
    horse: 0,
    iron: 0,
    money: 0,
    stone: 0,
    wood: 0,
  };
  resourceBuildings: IResources = {
    iron: 0,
    money: 0,
    stone: 0,
    wood: 0,
    horse: 0,
  };

  constructor(tile: Tile, img: HTMLImageElement, civ: Civilization) {
    super(tile, img, civ);
    tile.modifier = undefined;
    const adj = tile.GetAdj().filter((t) => !t.owner);
    tile.owner = this;
    adj.forEach((t) => (t.owner = this));

    this.tiles = adj;
    this.timeLeftToGrow = 0;
    this.name = "Name";
    tile.city = this;
  }

  Update() {
    super.Update();

    this.map.c.fillStyle = "black";
    this.map.c.fillRect(this.pos.x, this.pos.y - 40, Tile.size * 2, 60);
    this.map.c.fillStyle = "white";
    this.map.c.font = "40px Arial";
    this.map.c.fillText(
      `${this.name}: P: ${this._stats.pop} D: ${this.defense}`,
      this.pos.x,
      this.pos.y - 10,
      Tile.size * 2
    );
  }

  Select() {
    if (this.map.game.mainCiv.id !== this.civ.id) return;

    this.civ.DeselectLastEntity();
    this.civ.game.ui.ShowCity(this);
    this.civ.game.map.Focus(this.pos);
    this.selected = true;
  }
  Deselect() {
    this.civ.game.ui.HideCity();
    this.selected = false;
  }
  isFree() {
    return this.production === undefined && this.available.length > 0;
  }

  OnTurn() {
    //#region Population Growth
    if (this.growthFactor !== 0) this.timeLeftToGrow--;

    if (this.timeLeftToGrow <= 0) {
      this._stats.pop += this.growthFactor;


      if (this.maxCitizens < this._stats.pop && this.growthFactor > 0) {
        if (this.civ.id !== this.civ.game.mainCiv.id) return;

        this.maxCitizens = this._stats.pop;
        const rtiles = this.tiles.map((t) =>
          t.GetAdj().filter((t) => !t.owner)
        );
        //@ts-ignore
        const picked = this.map.RandomItem<Tile>(rtiles.flat());
        picked.owner = this;
        this.tiles.push(picked);
      }
      this.SetTurnsAndGrowthFactor();
    }

    //#endregion

    if (this.production?.Next()) delete this.production;
    // look for new available buildings
    BuildingsJSON.forEach((building) => {
      if (this.built.find((b) => b.data.name === building.name)) return;
      if (this.available.find((a) => a.name === building.name)) return;

      const reqs = building.requires;
      if (!reqs.every((r) => this.built.find((b) => b.data.name === r))) return;

      this.AddAvailable(building);
    });

    this.selected && this.Select();
  }
  Build(builder: IBuilder) {
    type reskey = keyof IResources;
    const canBuild = Object.keys(builder.data.cost).every(
      //@ts-ignore
      (e) => this.civ.resources[e] >= builder.data.cost[e]
    );
    if (!canBuild) return;

    for (const key in builder.data.cost)
      this.civ.resources[key as reskey] -= builder.data.cost[key as reskey];

    this.production = new Production(builder, this);
    this.Select();
    this.civ.NextAction();
    this.SendUpdate()
  }
  AddResourceBuilding(res: keyof IResources, value = 1) {
    this.resourceBuildings[res] += value;
    this.civ.game.ui.UpdateResources(this.civ);
    this.SendUpdate()
  }
  AddAvailable(e: IProduct) {
    if (!e) throw new Error("Available product is undefined");
    this.available.push(e);
    this.SendUpdate()
  }
  RemoveAvailable(name: string) {
    this._available = this._available.filter((t) => t.name !== name);
    this.SendUpdate()
  }
  SetCitizen(action: "inc" | "dec", key: keyof TAssignedCitizen) {
    if (action === "inc" && this.assignedCitizenCount >= this.stats.pop) return;
    else if (action === "dec" && this.assignedCitizenCount === 0) return;

    //@ts-ignore
    if (key !== "food" && key !== "money" && key !== "prod")
      if (!this.resourceBuildings[key]) return;

    const value = action === "inc" ? 1 : -1;
    this.assignedCitizens[key] += value;
    this.Select();
    this.SendUpdate()
  }
  ReceiveDamage(amount: number) {
    this._defense = Math.max(this.defense - amount, 0);
    this.SendUpdate()
  }
  UpdateData(data: SerializedCity) {
    const tiles = data.tiles.map(t => this.civ.game.map.tiles[t.x][t.y])
    tiles.forEach(t => t.owner = this)
    this.tiles = tiles
    this._defense = data.defense;
    this._stats = data.stats;

    if (data.prod) {
      const isProdUnit = UnitsJSON.findIndex(t => t.name === data.prod) > -1
      if (isProdUnit) this.production = new Production(GetUnitBuilder(UnitsJSON.find(t => t.name === data.prod), this.civ, this.tile), this)
      else this.production = new Production(GetBuildingBuilder(BuildingsJSON.find(t => t.name === data.prod), this), this)
    }

    this.built = data.built.map(t => GetBuildingBuilder(BuildingsJSON.find(b => b.name === t), this).Build() as Building)
    this._available = data.available.map(a => {
      const unitIndex = UnitsJSON.findIndex(t => t.name === a)
      if (unitIndex > -1) return UnitsJSON[unitIndex]
      else return BuildingsJSON.find(t => t.name === a)
    })
    this.assignedCitizens = data.assignedCitizens
    this.resourceBuildings = data.resourceBuildings
    this.maxCitizens = data.maxCitizens
    this.growthFactor = data.growthFactor
    this.timeLeftToGrow = data.timeLeftToGrow
  }
  SendUpdate() {
    this.civ.game.network.UpdateCity(this.Serialize())
  }
  Serialize(): SerializedCity {
    return {
      mapPos: this.tile.mapPos,
      tiles: this.tiles.map(t => t.mapPos),
      defense: this.defense,
      stats: this._stats,
      prod: this.production ? this.production.builder.data.name : undefined,
      built: this.built.map(t => t.data.name),
      available: this.available.map(t => t.name),
      assignedCitizens: this.assignedCitizens,
      resourceBuildings: this.resourceBuildings,
      growthFactor: this.growthFactor,
      maxCitizens: this.maxCitizens,
      timeLeftToGrow: this.timeLeftToGrow
    }
  }

  get stats(): Partial<IResources & IData> {
    const res: Partial<IResources & IData> = {};

    this.built.forEach((e) => {
      const data = e.GetData();
      Object.entries(data).forEach(([k, v]) => {
        //@ts-ignore
        if (!res[k]) res[k] = 0;
        //@ts-ignore
        res[k] += v;
      });
    });
    Object.entries(this.resourceBuildings).forEach(([k, v]) => {
      //@ts-ignore
      if (!res[k]) res[k] = 0;
      //@ts-ignore
      res[k] += v;
    });
    Object.entries(this.assignedCitizens).forEach(([k, v]) => {
      //@ts-ignore
      if (!res[k]) res[k] = 0;
      //@ts-ignore
      res[k] += Math.floor(v / 2);
    });

    res.food += this._stats.food;
    res.prod += this._stats.pop;
    res.pop = this._stats.pop;
    res.money += this._stats.pop;

    return res;
  }
  private SetTurnsAndGrowthFactor() {
    const { pop, food } = this.stats;
    const consumption = food - pop * 2;
    this.growthFactor = 0;
    if (consumption < 0) {
      this.timeLeftToGrow = 1;
      this.growthFactor = -1;
    } else if (consumption > 2) {
      this.timeLeftToGrow = City.TimeToGrow;
      this.growthFactor = 1;
    }
    this.SendUpdate()
  }
  get rawStats() {
    return this._stats;
  }
  get available() {
    return this._available;
  }
  get assignedCitizenCount() {
    return Object.values(this.assignedCitizens).reduce((p, c) => p + c);
  }
  get defense() {
    return this._defense
  }
}
