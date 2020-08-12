import { Civilization } from "./Civilization";
import { Entity } from "../Entity/Entity";
import City from "../Entity/City";
import CivsJSON from "../json/civinfo.json"
import { Game } from "..";
import { AlexandriaCity, CiociaCity } from "./CityDecorator";

class AlexandriaCivilization extends Civilization {
  AddEntity(e: Entity) {
    if (e instanceof City)
      super.AddEntity(new AlexandriaCity(e.tile, e.img, e.civ));
    else super.AddEntity(e);
  }
}
class CiociaCivilization extends Civilization {
  AddEntity(e: Entity) {
    if (e instanceof City) {
      e.img = this.game.assets.MiastoCiocia;
      super.AddEntity(new CiociaCity(e.tile, e.img, e.civ))
    } else super.AddEntity(e)
  }
}


export function GetCivilization(
  id: number,
  name: keyof typeof CivsJSON,
  game: Game,
) {
  switch (name) {
    case "Alexandria":
      return new AlexandriaCivilization(game, name, CivsJSON[name].color, id)
    case "Ciocia":
      return new CiociaCivilization(game, name, CivsJSON[name].color, -1)
  }
}
