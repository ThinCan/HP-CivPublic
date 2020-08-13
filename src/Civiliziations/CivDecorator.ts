import { Civilization } from "./Civilization";
import { Entity } from "../Entity/Entity";
import City from "../Entity/City";
import CivsJSON from "../json/civinfo.json"
import { Game } from "..";
import { AlexandriaCity, CiociaCity } from "./CityDecorator";

class AlexandriaCivilization extends Civilization {
  AddEntity(e: Entity) {
    if (e instanceof City)
      super.AddEntity(new AlexandriaCity(e));
    else super.AddEntity(e);
  }
}
class CiociaCivilization extends Civilization {
  AddEntity(e: Entity) {
    if (e instanceof City) {
      e.img = this.game.assets.MiastoCiociaZamkniete;
      super.AddEntity(new CiociaCity(e))
    } else super.AddEntity(e)
  }
  NextTurn() {
    this.cities.forEach(t => t.NextTurn())
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
