import { Civilization } from "./Civilization";
import { Entity } from "../Entity/Entity";
import City from "../Entity/City";
import { ZadupiusCity } from "./CityDecorator";

export class ZadupiusCiv extends Civilization {
  AddEntity(e: Entity) {
    if (e instanceof City)
      super.AddEntity(new ZadupiusCity(e.tile, e.img, e.civ));
    else super.AddEntity(e);
  }
}
