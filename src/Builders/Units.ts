import { IUnitJson, IProduct } from "../Util/GlobalInterfaces";
import City from "../Entity/City";
import Tile, { TileType } from "../Tile";
import Unit, { IUnitAction } from "../Entity/Unit";
import { Civilization } from "../Civiliziations/Civilization";
import { IBuilder } from "./Builder";
import TileModifier from "../json/modifiers.json";
import { IAsset } from "..";
import UnitsJSON from "../json/units.json"
import BuildingsJSON from "../json/citybuilding.json"

function FindBuildingByName(name: string) {
  return BuildingsJSON.find(t => t.name === name)
}

function GetMeleeAttack(unit: Unit) {
  const meleeAttack = () => {
    const adj = unit.tile.GetAdj();
    const filtered = adj.filter((t) => t.entity && t.entity.civ !== unit.civ);
    unit.SelectActionsTiles(filtered, "purple");
    unit.tileAction = (tile) => {
      tile.entity.ReceiveDamage(unit.attack);
      unit.walkingRange = 0;
      unit.civ.NextAction();
    };
  };
  return meleeAttack;
}
function GetRangeAttack(unit: Unit) {
  const rangeAttack = () => {
    const adj = unit.tile.GetAdj(3);
    unit.SelectActionsTiles(
      adj.filter((t) => t.entity && t.entity.civ !== unit.civ),
      "purple"
    );
    unit.tileAction = (tile) => {
      tile.entity.ReceiveDamage(unit.attack);
      unit.walkingRange = 0;
      unit.civ.NextAction();
    };
  };
  return rangeAttack;
}

function GetBasicUnitActions(unit: Unit): IUnitAction[] {
  return [
    {
      img: "./img/zamek.png",
      desc: "Czekaj",
      execute: () => {
        unit.walkingRange = 0;
        unit.Deselect();
        unit.civ.NextAction();
      },
    },
    {
      img: "./img/zamek.png",
      desc: "Rozwiąż jednostke",
      execute: () => {
        unit.civ.RemoveEntity(unit);
      },
    },
  ];
}
export abstract class UnitBuilder implements IBuilder {
  constructor(
    public data: IUnitJson,
    public owner: Civilization,
    public dest: Tile
  ) { }

  private GetUnit(img: keyof IAsset) {
    return new Unit(this.dest, this.assets[img], this.civ, this.data);
  }

  protected abstract GetUnitActions(unit: Unit): IUnitAction[];
  protected abstract GetUnitName(): keyof IAsset;
  protected OnBeforeBuild(unit: Unit) { }
  protected CreateUnitAction(
    desc: string,
    callback: () => void,
    img: string = "./img/zamek.png"
  ): IUnitAction {
    return { desc, execute: callback, img };
  }
  Build(broadcast = true) {
    const unit = this.GetUnit(this.GetUnitName());
    unit.actions = [...GetBasicUnitActions(unit), ...this.GetUnitActions(unit)];
    this.OnBeforeBuild(unit);
    this.civ.AddEntity(unit, broadcast)
  }
  get civ() { return this.owner }
  private get assets() {
    return this.civ.game.assets;
  }
}

class SettlerBuilder extends UnitBuilder {
  GetUnitActions(unit: Unit): IUnitAction[] {
    const buildCityCallback = () => {
      if (unit.tile.modifier) return;
      unit.civ.RemoveEntity(unit);
      unit.civ.AddEntity(
        new City(unit.tile, unit.civ.game.assets.Miasto, unit.civ)
      );
    };
    return [this.CreateUnitAction("Zbuduj miasto", buildCityCallback)];
  }
  GetUnitName(): keyof IAsset {
    return "Osadnik";
  }
}
class WorkerBuilder extends UnitBuilder {
  GetUnitActions(): IUnitAction[] {
    return [];
  }
  OnBeforeBuild(unit: Unit) {
    unit.additionalActionsCallback = (tile: Tile) => {
      const actions: IUnitAction[] = [];
      if (!tile.owner) return actions;
      if (tile.owner.civ !== unit.civ) return actions;
      if (!tile.modifier) return actions;

      switch (tile.modifier) {
        case TileModifier.forest:
          if (!tile.owner?.built.has(FindBuildingByName("Drwal"))) break;

          actions.push({
            desc: "Buduj Tartak",
            img: "./img/modifiers/sawmill.png",
            execute: () => {
              unit.action = {
                turns: 3,
                execute() {
                  tile.modifier = TileModifier.sawmill;
                  tile.owner.AddResourceBuilding("wood", 2);
                },
              };
            },
          });
          break;
        case TileModifier.iron:
          if (!tile.owner?.built.has(FindBuildingByName("Huta"))) break;

          actions.push({
            desc: "Buduj kopalnie żelaza",
            img: "./img/modifiers/mine.png",
            execute: () => {
              unit.action = {
                turns: 3,
                execute() {
                  (tile.modifier = TileModifier.mine),
                    tile.owner.AddResourceBuilding("iron", 2);
                },
              };
            },
          });
          break;
        case TileModifier.stone:
          if (!tile.owner?.built.has(FindBuildingByName("Kamieniołom")))
            break;

          actions.push({
            desc: "Buduj Kamieniołom",
            img: "./img/modifiers/stonemine.png",
            execute: () => {
              unit.action = {
                turns: 3,
                execute() {
                  (tile.modifier = TileModifier.stonemine),
                    tile.owner.AddResourceBuilding("stone", 2);
                },
              };
            },
          });
          break;
      }
      return actions;
    };
  }
  GetUnitName(): keyof IAsset {
    return "Robotnik";
  }
}
class ArcherBuilder extends UnitBuilder {
  GetUnitName(): keyof IAsset {
    return "Lucznik";
  }
  GetUnitActions(unit: Unit): IUnitAction[] {
    return [this.CreateUnitAction("Atak zasięgowy", GetRangeAttack(unit))];
  }
}
class DocentBuilder extends UnitBuilder {
  GetUnitName(): keyof IAsset {
    return "Docent";
  }
  GetUnitActions(unit: Unit): IUnitAction[] {
    const findCrystal = (() => {
      let tile: Tile;
      return function () {
        if (!tile)
          tile = unit.map.tilesArray.find(
            (t) => t.modifier === TileModifier.mineral
          );
        const dist = tile.FindPath(unit.tile).length - 1;
        unit.civ.game.ui.appendToActionLog(`Dystans do minerału: ${dist}`);
        unit.walkingRange = 0;
        unit.civ.NextAction();
      };
    })();
    unit.additionalActionsCallback = (tile) => {
      const actions: IUnitAction[] = [];
      console.warn("DODAC DO ONLINE");
      if (tile.modifier === TileModifier.mineral) {
        tile.displayModifier = true;
        unit.civ.game.ui.appendToActionLog("Minerał fiutta odnaleziony!");
        actions.push({
          desc: "Zacznij wydobywać minerał",
          img: "./img/modifiers/mineral.png",
          execute() {
            unit.civ.resources.Add("mineral", 0.1)
            unit.walkingRange = 0;
            unit.civ.NextAction();
          },
        });
      }

      return actions;
    };

    return [
      this.CreateUnitAction(
        "Szukaj kryształu",
        findCrystal,
        "./img/modifiers/mineral.png"
      ),
    ];
  }
}

class WarriorBuilder extends UnitBuilder {
  GetUnitName(): keyof IAsset {
    return "Wojownik";
  }
  GetUnitActions(unit: Unit): IUnitAction[] {
    return [this.CreateUnitAction("Atak", GetMeleeAttack(unit))];
  }
}
class TaranBuilder extends UnitBuilder {
  GetUnitName(): keyof IAsset {
    return "Taran";
  }
  GetUnitActions(unit: Unit): IUnitAction[] {
    return [];
  }
}
class CatapultBuilder extends UnitBuilder {
  GetUnitName(): keyof IAsset {
    return "Katapulta";
  }
  GetUnitActions(unit: Unit): IUnitAction[] {
    const bombardAttack = () => {
      const adj = unit.tile.GetAdj(3);
      const filtered = adj.filter((t) => t.city && t.city.civ !== unit.civ);
      unit.SelectActionsTiles(filtered, "purple");
      unit.tileAction = (tile) => {
        const city = tile.city;
        city.ReceiveDamage(unit.attack);
        unit.walkingRange = 0;
        unit.civ.NextAction();
      };
    };
    return [this.CreateUnitAction("Atakuj miasto", bombardAttack)];
  }
}
class CannonBuilder extends UnitBuilder {
  GetUnitName(): keyof IAsset {
    return "Armata";
  }
  GetUnitActions(unit: Unit): IUnitAction[] {
    const bombardAttack = () => {
      const adj = unit.tile.GetAdj(3);
      const filtered = adj.filter((t) => t.city && t.city.civ !== unit.civ);
      unit.SelectActionsTiles(filtered, "purple");
      unit.tileAction = (tile) => {
        const city = tile.city;
        city.ReceiveDamage(unit.attack);
        unit.walkingRange = 0;
        unit.civ.NextAction();
      };
    };
    return [this.CreateUnitAction("Atakuj miasto", bombardAttack)];
  }
}
class CavalryBuilder extends UnitBuilder {
  GetUnitName(): keyof IAsset {
    return "Konny";
  }
  GetUnitActions(unit: Unit): IUnitAction[] {
    return [this.CreateUnitAction("Atak", GetMeleeAttack(unit))];
  }
}
class KnightBuilder extends UnitBuilder {
  GetUnitName(): keyof IAsset {
    return "Rycerz";
  }
  GetUnitActions(unit: Unit): IUnitAction[] {
    return [this.CreateUnitAction("Atak", GetMeleeAttack(unit))];
  }
}
class CrossbowBuilder extends UnitBuilder {
  GetUnitName(): keyof IAsset {
    return "Kusznik";
  }
  GetUnitActions(unit: Unit): IUnitAction[] {
    return [this.CreateUnitAction("Atak zasięgowy", GetRangeAttack(unit))];
  }
}
class ChariotBuilder extends UnitBuilder {
  GetUnitName(): keyof IAsset {
    return "Rydwan";
  }
  GetUnitActions(unit: Unit): IUnitAction[] {
    return [this.CreateUnitAction("Atak", GetMeleeAttack(unit))];
  }
}
class ShipBuilder extends UnitBuilder {
  GetUnitName(): keyof IAsset {
    return "Statek";
  }
  GetUnitActions(unit: Unit): IUnitAction[] {
    const unitCargo: Unit[] = []
    const LoadUnit = () => {
      const tiles = unit.tile.GetAdj().filter(t => t.entity && t.entity.civ === unit.civ && t.entity !== unit)
      if (tiles.length === 0) return

      unit.SelectActionsTiles(tiles, "purple")
      unit.tileAction = tile => {
        unitCargo.push(tile.entity)
        unit.civ.RemoveEntity(tile.entity)
      }
    }
    const UnloadUnit = () => {
      const tiles = unit.tile.GetAdj().filter(t => !t.entity && !t.city && t.type !== TileType.Woda)
      if (tiles.length === 0 || unitCargo.length === 0) return
      unit.SelectActionsTiles(tiles, "purple")
      unit.tileAction = tile => {
        const unloaded = unitCargo.pop()
        unit.civ.AddEntity(unloaded)
        unloaded.tile = tile
        tile.entity = unloaded
      }
    }
    return [this.CreateUnitAction("Załaduj jednostke", LoadUnit), this.CreateUnitAction("Wyładuj jednostke", UnloadUnit)];
  }
  OnBeforeBuild(unit: Unit) {
    unit.isLandUnit = false
    unit.tile.entity = undefined
    const nt = unit.tile.GetAdj().find(t => t.type === TileType.Woda)
    unit.tile = nt
    nt.entity = unit
  }
}

export function GetUnitBuilder(data: IUnitJson, tile: Tile, owner: Civilization) {
  const Resolver =
    <T extends UnitBuilder>(ctor: new (...args: any[]) => T): T => new ctor(data, owner, tile);

  switch (data.name) {
    case "Osadnik":
      return Resolver(SettlerBuilder);
    case "Robotnik":
      return Resolver(WorkerBuilder);
    case "Lucznik":
      return Resolver(ArcherBuilder);
    case "Docent":
      return Resolver(DocentBuilder);
    case "Wojownik":
      return Resolver(WarriorBuilder);
    case "Kusznik":
      return Resolver(CrossbowBuilder);
    case "Rydwan":
      return Resolver(ChariotBuilder);
    case "Rycerz":
      return Resolver(KnightBuilder);
    case "Katapulta":
      return Resolver(CatapultBuilder);
    case "Armata":
      return Resolver(CannonBuilder);
    case "Konny":
      return Resolver(CavalryBuilder);
    case "Taran":
      return Resolver(TaranBuilder);
    case "Statek":
      return Resolver(ShipBuilder);

    default:
      throw new Error("Unit type not recognized ::GetUnitBuilder" + data.name);
  }
}
