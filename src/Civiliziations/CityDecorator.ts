import City from "../Entity/City";
import { IProduct } from "../Util/GlobalInterfaces";
import * as BuildingsJSON from "../json/citybuilding.json";
import * as UnitsJSON from "../json/units.json";

export class ZadupiusCity extends City {
  AddAvailable(e: IProduct) {
    if (e.name === "Dzielnica handlowa")
      super.AddAvailable(
        BuildingsJSON.find(
          (e) => e.name === "Kondominium pod żydowskim zarządem powierniczym"
        )
      );
    else if (e.name === "Arkebuzer")
      super.AddAvailable(UnitsJSON.find((e) => e.name === "Muszkieter"));
    else super.AddAvailable(e);
  }
}
