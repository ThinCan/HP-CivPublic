import { IBuilder, Production } from "../Builders/Builder";
import { Civilization } from "../Civiliziations/Civilization";
import BuildingsJSON from "../json/citybuilding.json";
import UnitsJSON from "../json/units.json";
import Tile, { TileType } from "../Tile";
import { IResources, IProduct, SerializedCity, ICityStats, IBuildingJson } from "../Util/GlobalInterfaces";
import { Entity } from "./Entity";
import { GetUnitBuilder } from "../Builders/Units";
import { GetBuildingBuilder } from "../Builders/Buildings";
import { IAsset } from "..";
import { ResourceMap } from "../Util/ResourceMap";

export type TAssignedCitizen = IResources & { prod: number; food: number };

export default class City extends Entity {
  static TimeToGrow = 5;

  name: string;
  stats = new ResourceMap<ICityStats>({ food: 6, pop: 1, prod: 1 })
  assignedCitizens = new ResourceMap<TAssignedCitizen>()
  resourcesProduced = new ResourceMap<IResources>()

  tiles: Tile[] = [];

  timeLeftToGrow: number = 0;
  growthFactor = 0;

  maxCitizens = this.stats.Get("pop")
  production: Production;
  built = new Set<IBuildingJson>()

  available: Set<IProduct> = new Set([
    BuildingsJSON[0],
    UnitsJSON[0],
    UnitsJSON[1],
    BuildingsJSON.find((e) => e.name === "Kamieniołom"),
  ])
  private _defense: number = 30;
  get defense() { return this._defense }

  constructor(tile: Tile, img: HTMLImageElement, civ: Civilization) {
    super(tile, img, civ);
    tile.owner = this;

    const adj = tile.GetAdj().filter((t) => !t.owner);
    adj.forEach((t) => (t.owner = this));

    if (adj.find(t => t.type === TileType.Woda)) this.AddAvailable(BuildingsJSON.find(t => t.name === "Stocznia"))

    this.tiles = adj;
    this.timeLeftToGrow = 0;
    this.name = "Name";
    tile.city = this;
  }

  Update() {
    if (!this.tile.shouldDrawCity) return
    super.Update();

    this.map.c.fillStyle = "black";
    this.map.c.fillRect(this.pos.x, this.pos.y - 40, Tile.size * 2, 60);
    this.map.c.fillStyle = "white";
    this.map.c.font = "40px Arial";
    this.map.c.fillText(
      `${this.name}: P: ${this.stats.Get("pop")} D: ${this.defense}`,
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
    return this.production === undefined && this.available.size > 0;
  }

  OnTurn() {
    if(this.civ === this.civ.game.mainCiv)
    this.tiles.forEach(t => t.SetVisibility(true))

    //#region Population Growth
    if (this.growthFactor !== 0) this.timeLeftToGrow--;

    if (this.timeLeftToGrow <= 0) {
      this.stats.Add("pop", this.growthFactor)

      if (this.maxCitizens < this.stats.Get("pop") && this.growthFactor > 0) {
        if (this.civ.id === this.civ.game.mainCiv.id) {
          this.maxCitizens = this.stats.Get("pop")
          const rtiles = this.tiles.map((t) =>
            t.GetAdj().filter((t) => !t.owner)
          );
          //@ts-ignore
          const picked = this.map.RandomItem<Tile>(rtiles.flat());
          picked.owner = this;
          this.tiles.push(picked);
        }
      }
      this.SetTurnsAndGrowthFactor();
      this.SendUpdate()
    }

    //#endregion
    this.production?.Next()
    console.log(this.production)

    // look for new available buildings
    BuildingsJSON.forEach((building) => {
      if(this.built.has(building)) return
      const reqs = building.requires;
      if (!reqs.every((r) => this.built.has(BuildingsJSON.find(t => t.name === r)))) return;

      this.AddAvailable(building);
    });

    this.selected && this.Select();
  }
  Build(production: Production) {
    type reskey = keyof IResources;
    const { builder } = production
    const canBuild = Object.keys(builder.data.cost).every(
      //@ts-ignore
      (e) => this.civ.resources.Get(e) >= builder.data.cost[e]
    );
    if (!canBuild) return;

    for (const key in builder.data.cost)
      this.civ.resources.Subtract(key as reskey, builder.data.cost[key as reskey])

    this.production = production
    this.Select();
    this.civ.NextAction();
    this.SendUpdate()
  }
  AddResourceBuilding(res: keyof IResources, value = 1) {
    this.resourcesProduced.Add(res, value)
    this.civ.game.ui.UpdateResources(this.civ);
    this.SendUpdate()
  }
  AddAvailable(e: IProduct) {
    this.available.add(e)
    this.SendUpdate()
  }
  RemoveAvailable(e: IProduct) {
    if ("health" in e) return;

    this.available.delete(e)
    this.SendUpdate()
  }
  SetCitizen(action: "inc" | "dec", key: keyof TAssignedCitizen) {
    const assignedCitizenCount = this.assignedCitizens.SumAllValues()
    if (action === "inc" && assignedCitizenCount >= this.stats.Get("pop")) return;
    else if (action === "dec" && assignedCitizenCount === 0) return;

    const value = action === "inc" ? 1 : -1;
    this.assignedCitizens.Add(key, value)
    if (key === "prod" || key === "food") this.stats.Add(key, value)
    else this.resourcesProduced.Add(key, value)

    this.Select();
    this.SendUpdate()
  }
  ReceiveDamage(amount: number) {
    this._defense = Math.max(this.defense - amount, 0);
    this.SendUpdate()
  }
  UpdateData(data: SerializedCity) {
    console.log("aktuazlizuje")    
    const tiles = data.tiles.map(t => this.civ.game.map.tiles[t.x][t.y])
    tiles.forEach(t => t.owner = this)
    this.tiles = tiles
    this._defense = data.defense;
    this.stats.Consume(data.stats as any)

    if (data.prod) {
      const isProdUnit = UnitsJSON.find(t => t.name === data.prod)
      if (isProdUnit) this.production = new Production(GetUnitBuilder(isProdUnit, this.tile, this.civ))
      else this.production = new Production(GetBuildingBuilder(BuildingsJSON.find(t => t.name === data.prod), this))
    }

    this.built = new Set(data.built.map(t => BuildingsJSON.find(b => b.name === t)))

    data.available.forEach(a => {
      this.available.clear()
      const unitIndex = UnitsJSON.findIndex(t => t.name === a)
      if (unitIndex > -1) this.available.add(UnitsJSON[unitIndex])
      else this.available.add(BuildingsJSON.find(b => b.name === a))
    })

    this.assignedCitizens.Consume(data.assignedCitizens)
    this.resourcesProduced.Consume(data.resourcesProduced)
    this.maxCitizens = data.maxCitizens
    this.growthFactor = data.growthFactor
    this.timeLeftToGrow = data.timeLeftToGrow
  }
  SendUpdate() {
    if(this.civ === this.civ.game.mainCiv)
    this.civ.game.network.UpdateCity(this.Serialize())
  }
  Serialize(): SerializedCity {
    return {
      mapPos: this.tile.mapPos,
      tiles: this.tiles.map(t => t.mapPos),
      defense: this.defense,
      stats: this.stats.ToObject(),
      prod: this.production ? this.production.builder.data.name : undefined,
      built: [...this.built.keys()].map(t => t.name),
      available: [...this.available].map(v => v.name),
      assignedCitizens: this.assignedCitizens.ToObject(),
      resourcesProduced: this.resourcesProduced.ToObject(),
      growthFactor: this.growthFactor,
      maxCitizens: this.maxCitizens,
      timeLeftToGrow: this.timeLeftToGrow
    }
  }
  private SetTurnsAndGrowthFactor() {
    const { pop, food } = this.stats.Pick("pop", "food");
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
  TransferOwnership(civ: Civilization) {
    this.civ.RemoveEntity(this)
    this.civ = civ
    this.civ.AddEntity(this)
  }

}
