import { IBuilder } from "./Builder";
import City from "../Entity/City";
import { IBuildingJson } from "../Util/GlobalInterfaces";
import UnitsJSON from "../json/units.json";
import { Civilization } from "../Civiliziations/Civilization";

function FindUnitInJSON(name: string) {
  return UnitsJSON.find((e) => e.name === name);
}

abstract class BuildingBuilder implements IBuilder {
  civ: Civilization
  constructor(public data: IBuildingJson, public city: City) { this.civ = city.civ }
  abstract Build(): void;
}
//#region builders
class FarmBuilder extends BuildingBuilder {
  Build() {
    this.city.stats.Add("food", 3)
  }
}
class LumberBuilder extends BuildingBuilder {
  Build() { }
}
class CarpenterBuilder extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("wood", -1);
  }
}
class HunterBuilder extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(UnitsJSON.find((e) => e.name === "Lucznik"));
    this.city.stats.Add("food", 2)
  }
}
class MillBuilder extends BuildingBuilder {
  Build() {
    this.city.stats.Add("food", 2)
    this.city.stats.Add("prod", 2)
  }
}
class QuarryBuilder extends BuildingBuilder {
  Build() { }
}
class WarriorBuilder extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(FindUnitInJSON("Wojownik"));
  }
}
class IronWorksBuilder extends BuildingBuilder {
  Build() {
  }
}
class BlacksmithBuilder extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("iron", -1);
    this.city.stats.Add("prod", 3)
  }
}
class CraftworkBuilder extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(UnitsJSON.find((e) => e.name === "Taran"));
    this.city.stats.Add("prod", 3)
  }
}
class Stables extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("horse", -1);
    this.city.AddAvailable(FindUnitInJSON("Konny"));
    this.city.stats.Add("prod", 3)
  }
}
class Grange extends BuildingBuilder {
  Build() {
    this.city.stats.Add("food", 3)
  }
}
class Estate extends BuildingBuilder {
  Build() {
    this.city.stats.Subtract("food", 3)
  }
}
class Shop extends BuildingBuilder {
  Build() {
    this.city.stats.Add("food", 1)
  }
}
class TradeDistrict extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("money", 5);
    this.city.AddResourceBuilding("wood", -1);
    this.city.AddResourceBuilding("stone", -2);
    this.city.AddResourceBuilding("iron", -1);
  }
}
class Market extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("money", 5);
    this.city.stats.Add("food", 6)
  }
}
class Bank extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("money", 2);
  }
}
class School extends BuildingBuilder {
  Build() {
    this.city.stats.Add("prod", 2)
  }
}
class ScienceDistrict extends BuildingBuilder {
  Build() {
    this.city.stats.Add("prod", 4)
  }
}
class Library extends BuildingBuilder {
  Build() {
    this.city.stats.Add("prod", 3)
  }
}
class University extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(FindUnitInJSON("Docent"));
    this.city.stats.Add("prod", 5)
  }
}
class FactoryDistrict extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("wood", -1);
    this.city.AddResourceBuilding("stone", -1);
    this.city.stats.Add("prod", 5)
  }
}
class Manufacture extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("iron", -1);
    this.city.stats.Add("prod", 3)
  }
}
class Factory extends BuildingBuilder {
  Build() {
    this.city.AddResourceBuilding("wood", -1);
    this.city.AddResourceBuilding("stone", -1);
    this.city.AddResourceBuilding("iron", -1);
    this.city.stats.Add("prod", 4)
  }
}
class Mason extends BuildingBuilder {
  Build() {
  }
}
class Wall_1 extends BuildingBuilder {
  Build() {
    this.city.ReceiveDamage(-50)
  }
}
class MilitaryDistrict extends BuildingBuilder {
  Build() {
    this.city.stats.Add("prod", 5)
  }
}
class CatapultsWorkshop extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(FindUnitInJSON("Katapulta"));
    this.city.AddResourceBuilding("wood", -1);
    this.city.AddResourceBuilding("iron", -1);
    this.city.stats.Add("prod", 5)
  }
}
class Engineer extends BuildingBuilder {
  Build() {
    this.city.stats.Add("prod", 5)
  }
}
class Crossbowmen extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(FindUnitInJSON("Kusznik"));
  }
}
class Chariots extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(FindUnitInJSON("Rydwan"));
  }
}
class KnightSchool extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(FindUnitInJSON("Rycerz"));
  }
}
class Chemlab extends BuildingBuilder {
  Build() { }
}
class CannonFactory extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(FindUnitInJSON("Armata"));
  }
}
class Shipyard extends BuildingBuilder {
  Build() {
    this.city.AddAvailable(FindUnitInJSON("Statek"));
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
    case "Chata wojownika":
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
    case "Stocznia":
      return Resolver(Shipyard);
    default:
      throw new Error("Building type not recognized ::GetBuildingBuilder");
  }
}
