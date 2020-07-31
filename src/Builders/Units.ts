import { IUnitJson } from "../Util/GlobalInterfaces";
import City from "../Entity/City";
import Tile from "../Tile";
import Unit, { IUnitAction } from "../Entity/Unit";
import { Civilization } from "../Civiliziations/Civilization";
import { IBuilder } from "./Builder";
import * as TileModifier from "../json/modifiers.json";

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
    public civ: Civilization,
    public dest: Tile
  ) {}
  abstract Build(): Unit;
}

class SettlerBuilder extends UnitBuilder {
  Build() {
    const unit = new Unit(
      this.dest,
      this.civ.game.assets.settler,
      this.civ,
      this.data
    );

    unit.actions = [
      {
        desc: "Zbuduj miasto",
        execute: function () {
          if (unit.tile.modifier) return;

          unit.civ.RemoveEntity(unit);
          unit.civ.AddEntity(
            new City(unit.tile, unit.civ.game.assets.city, unit.civ)
          );
        },
        img: "./img/zamek.png",
      },
      ...GetBasicUnitActions(unit),
    ];
    return unit;
  }
}

class WorkerBuilder extends UnitBuilder {
  Build() {
    const unit = new Unit(
      this.dest,
      this.civ.game.assets.worker,
      this.civ,
      this.data
    );
    unit.actions = GetBasicUnitActions(unit);

    unit.additionalActionsCallback = (tile: Tile) => {
      const actions: IUnitAction[] = [];
      if (!tile.owner) return actions;
      if (tile.owner.civ !== unit.civ) return actions;
      if (!tile.modifier) return actions;

      switch (tile.modifier) {
        case TileModifier.forest:
          if (!tile.owner?.built.find((e) => e.data.name === "Drwal")) break;

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
          if (!tile.owner?.built.find((e) => e.data.name === "Huta")) break;

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
          if (!tile.owner?.built.find((e) => e.data.name === "Kamieniołom"))
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

    return unit;
  }
}
class ArcherBuilder extends UnitBuilder {
  Build() {
    const unit = new Unit(
      this.dest,
      this.civ.game.assets.archer,
      this.civ,
      this.data
    );

    unit.actions = [
      {
        desc: "Atak zasięgowy",
        execute() {
          const tiles = unit.tile
            .GetAdj(3)
            .filter((t) => t.entity && t.entity.civ !== unit.civ);
          unit.SelectActionsTiles(tiles, "purple");
          unit.tileAction = (tile) => {
            tile.entity.ReceiveDamage(unit.attack)
            unit.walkingRange = 0;
            unit.civ.NextAction();
          };
        },
        img: "./img/zamek.png",
      },
    ];

    return unit;
  }
}
class DocentBuilder extends UnitBuilder {
  Build() {
    const unit = new Unit(
      this.dest,
      this.civ.game.assets.docent,
      this.civ,
      this.data
    );
    unit.actions = [
      ...GetBasicUnitActions(unit),
      {
        desc: "Wyszukaj minerał",
        img: "./img/zamek.png",
        execute: (() => {
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
        })(),
      },
    ];
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
            unit.civ.resources.mineral += 0.1;
            unit.walkingRange = 0;
            unit.civ.NextAction();
          },
        });
      }

      return actions;
    };

    return unit;
  }
}

class Builder extends UnitBuilder {
  Build(){
    const unit = new Unit(this.dest, this.civ.game.assets. , this.civ)

    return unit
  }
}
class Builder extends UnitBuilder {
  Build(){
    const unit = new Unit(this.dest, this.civ.game.assets. , this.civ)

    return unit
  }
}
class Builder extends UnitBuilder {
  Build(){
    const unit = new Unit(this.dest, this.civ.game.assets. , this.civ)

    return unit
  }
}
class Builder extends UnitBuilder {
  Build(){
    const unit = new Unit(this.dest, this.civ.game.assets. , this.civ)

    return unit
  }
}
class Builder extends UnitBuilder {
  Build(){
    const unit = new Unit(this.dest, this.civ.game.assets. , this.civ)

    return unit
  }
}
class Builder extends UnitBuilder {
  Build(){
    const unit = new Unit(this.dest, this.civ.game.assets. , this.civ)

    return unit
  }
}
class Builder extends UnitBuilder {
  Build(){
    const unit = new Unit(this.dest, this.civ.game.assets. , this.civ)

    return unit
  }
}

export function GetUnitBuilder(data: IUnitJson, civ: Civilization, tile: Tile) {
  const Resolver = <T extends UnitBuilder>(
    ctor: new (...args: any[]) => T
  ): T => new ctor(data, civ, tile);
  switch (data.name) {
    case "Osadnik":
      return Resolver(SettlerBuilder);
    case "Robotnik":
      return Resolver(WorkerBuilder);
    case "Łucznik":
      return Resolver(ArcherBuilder);
    case "Docent":
      return Resolver(DocentBuilder);

    default:
      throw new Error("Unit type not recognized ::GetUnitBuilder");
  }
}
