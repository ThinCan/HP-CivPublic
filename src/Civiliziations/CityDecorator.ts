import City from "../Entity/City";
import { IProduct } from "../Util/GlobalInterfaces";
import BuildingsJSON from "../json/citybuilding.json";

export class AlexandriaCity extends City {
  AddAvailable(e: IProduct) {
    if (e.name === "Dzielnica handlowa")
      super.AddAvailable(
        BuildingsJSON.find(
          (e) => e.name === "Kondominium pod żydowskim zarządem powierniczym"
        )
      );
    else super.AddAvailable(e);
  }
}
export class CiociaCity extends City {
  
}