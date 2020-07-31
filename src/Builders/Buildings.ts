import { Building, IBuilder } from "./Builder";
import City from "../Entity/City";
import { IBuildingJson } from "../Util/GlobalInterfaces";
import * as UnitsJSON from "../json/units.json";

function FindUnitInJSON(name: string) {
  return UnitsJSON.find((e) => e.name === name);
}

export abstract class BuildingBuilder implements IBuilder {
  constructor(public data: IBuildingJson, public city: City) {}
  abstract Build(): Building;
}
//#region builders
class FarmBuilder extends BuildingBuilder {
  Build() {
    return new Building(() => ({ food: 3 }), this.data);
  }
}
class LumberBuilder extends BuildingBuilder {
  Build() {
    return new Building(() => ({}), this.data);
  }
}
class CarpenterBuilder extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("wood", -1);
    return new Building(() => ({}), this.data);
  }
}
class HunterBuilder extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(UnitsJSON.find((e) => e.name === "Łucznik"));
    return new Building(() => ({ food: 2 }), this.data);
  }
}
class MillBuilder extends BuildingBuilder {
  Build() {
    return new Building(() => ({ food: 2, prod: 2 }), this.data);
  }
}
class QuarryBuilder extends BuildingBuilder {
  Build() {
    return new Building(() => ({}), this.data);
  }
}
class WarriorBuilder extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(UnitsJSON.find((e) => e.name === "Łucznik"));
    return new Building(() => ({}), this.data);
  }
}
class IronWorksBuilder extends BuildingBuilder {
  Build() {
    return new Building(() => ({}), this.data);
  }
}
class BlacksmithBuilder extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("iron", -1);
    return new Building(() => ({ prod: 3 }), this.data);
  }
}
class CraftworkBuilder extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(UnitsJSON.find((e) => e.name === "Taran"));
    return new Building(() => ({ prod: 3 }), this.data);
  }
}
class Stables extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("horse", -1);
    this.city.AddAvailable(FindUnitInJSON("Konny"));
    return new Building(() => ({ food: 3 }), this.data);
  }
}
class Grange extends BuildingBuilder {
  Build() {
    return new Building(() => ({ food: 3 }), this.data);
  }
}
class Estate extends BuildingBuilder {
  Build() {
    return new Building(() => ({ food: -3 }), this.data);
  }
}
class Shop extends BuildingBuilder {
  Build() {
    return new Building(() => ({ food: 1 }), this.data);
  }
}
class TradeDistrict extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("money", 5);
    this.city.AddResourceBuilding("wood", -1);
    this.city.AddResourceBuilding("stone", -2);
    this.city.AddResourceBuilding("iron", -1);
    return new Building(() => ({}), this.data);
  }
}
class Market extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("money", 5);
    return new Building(() => ({food: 6}), this.data);
  }
}
class Bank extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("money", 2);
    return new Building(() => ({}), this.data);
  }
}
class School extends BuildingBuilder {
  Build() {
    return new Building(() => ({ prod: 2 }), this.data);
  }
}
class ScienceDistrict extends BuildingBuilder {
  Build() {
    return new Building(() => ({ prod: 4 }), this.data);
  }
}
class Library extends BuildingBuilder {
  Build() {
    return new Building(() => ({ prod: 3 }), this.data);
  }
}
class University extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(FindUnitInJSON("Docent"))
    return new Building(() => ({ prod: 5 }), this.data);
  }
}
class FactoryDistrict extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("wood", -1);
    this.city.AddResourceBuilding("stone", -1);
    return new Building(() => ({ prod: 5 }), this.data);
  }
}
class Manufacture extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("iron", -1);
    return new Building(() => ({ prod: 3 }), this.data);
  }
}
class Factory extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("wood", -1);
    this.city.AddResourceBuilding("stone", -1);
    this.city.AddResourceBuilding("iron", -1);
    return new Building(() => ({ prod:4 }), this.data);
  }
}
class Mason extends BuildingBuilder {
  Build() {
    return new Building(() => ({ }), this.data);
  }
}
class Wall_1 extends BuildingBuilder {
  Build() {
    //this.city.defense += 50
    return new Building(() => ({}), this.data);
  }
}
class MilitaryDistrict extends BuildingBuilder {
  Build() {
    return new Building(() => ({ prod: 5 }), this.data);
  }
}
class CatapultsWorkshop extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(FindUnitInJSON("Katapulta"));
    this.city.AddResourceBuilding("wood", -1);
    this.city.AddResourceBuilding("iron", -1);
    return new Building(() => ({ prod: 5 }), this.data);
  }
}
class Engineer extends BuildingBuilder {
  Build() {
    return new Building(() => ({ prod: 5 }), this.data);
  }
}
class Crossbowmen extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(FindUnitInJSON("Kusznik"));
    return new Building(() => ({}), this.data);
  }
}
class Chariots extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(FindUnitInJSON("Rydwan"));
    return new Building(() => ({}), this.data);
  }
}
class KnightSchool extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(FindUnitInJSON("Rycerz"));
    return new Building(() => ({}), this.data);
  }
}
class Chemlab extends BuildingBuilder {
  Build() {
    return new Building(() => ({}), this.data);
  }
}
class CannonFactory extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(FindUnitInJSON("Armata"));
    return new Building(() => ({}), this.data);
  }
}
//#endregion

export function GetBuildingBuilder(data: IBuildingJson, city: City): IBuilder {
  const Resolver = <T extends BuildingBuilder>(
    ctor: new (...args: any[]) => T
  ): T => new ctor(data, city);

  switch (data.name) {
    case "Farma":
      return Resolver(FarmBuilder);
    case "Drwal":
      return Resolver(LumberBuilder);
    case "Stolarz":
      return Resolver(CarpenterBuilder);
    case "Myśliwy":
      return Resolver(HunterBuilder);
    case "Młyn":
      return Resolver(MillBuilder);
    case "Kamieniołom":
      return Resolver(QuarryBuilder);
    case "Wojownik":
      return Resolver(WarriorBuilder);
    case "Huta":
      return Resolver(IronWorksBuilder);
    case "Kowal":
      return Resolver(BlacksmithBuilder);
    case "Zakład rzemieślniczy":
      return Resolver(CraftworkBuilder);
    case "Stajnia":
      return Resolver(Stables);
    case "Folwark":
      return Resolver(Grange);
    case "Dzielnica mieszkaniowia":
      return Resolver(Estate);
    case "Sklep":
      return Resolver(Shop);
    case "Dzielnica handlowa":
      return Resolver(TradeDistrict);
    case "Targowisko":
      return Resolver(Market);
    case "Bank":
      return Resolver(Bank);
    case "Szkoła":
      return Resolver(School);
    case "Dzielnica naukowa":
      return Resolver(ScienceDistrict);
    case "Biblioteka":
      return Resolver(Library);
    case "Uniwersytet":
      return Resolver(University);
    case "Dzielnica przemysłowa":
      return Resolver(FactoryDistrict);
    case "Manufaktura":
      return Resolver(Manufacture);
    case "Fabryka":
      return Resolver(Factory);
    case "Murarz":
      return Resolver(Mason);
    case "Mur 1":
      return Resolver(Wall_1);
    case "Dzielnica wojskowa":
      return Resolver(MilitaryDistrict);
    case "Warsztat katapult":
      return Resolver(CatapultsWorkshop);
    case "Inżynier":
      return Resolver(Engineer);
    case "Kusznicy":
      return Resolver(Crossbowmen);
    case "Rydwany":
      return Resolver(Chariots);
    case "Szkoła rycerska":
      return Resolver(KnightSchool);
    case "Pracownia chemiczna":
      return Resolver(Chemlab);
    case "Fabryka armat":
      return Resolver(CannonFactory);
    default:
      throw new Error("Building type not recognized ::GetBuildingBuilder");
  }
}
console.warn("UPDATE MARKET (add slot for trader)");
console.warn("UPDATE Walls (add slot for city defense)");
