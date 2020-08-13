import City from "../Entity/City";
import { IProduct } from "../Util/GlobalInterfaces";
import BuildingsJSON from "../json/citybuilding.json";
import { Civilization } from "./Civilization";
import Unit from "../Entity/Unit";


abstract class CityDecorator extends City {

  constructor(city: City) {
    super(city.tile, city.img, city.civ)
    this.tiles = city.tiles
  }
}

export class AlexandriaCity extends CityDecorator {
  constructor(city: City) {
    super(city)
  }

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
export class CiociaCity extends CityDecorator {
  occupyingCiv: Civilization
  occupyingUnit: Unit
  private turnsToWin = 30
  private turns = 30

  TransferOwnership(civ: Civilization) {
    this.occupyingUnit = this.tile.entity
    this.img = this.civ.game.assets.MiastoCiociaOtwarte
    this.civ.game.network.SendLog("Nieznana cywilizacja przejela miasto cioci. Do wygranej pozostało " + this.turns + " tur", true)
    civ.resources.Subtract("mineral", 1)
  }
  OnTurn() {
    const n = this.civ.game.network
    if (!this.tile.entity && this.occupyingUnit) {
      n.SendLog("Miasto cioci jest pod niczyją kontrolą.", true)
      this.turns = this.turnsToWin
      this.occupyingCiv = undefined
      this.occupyingUnit = undefined
    }
    if (this.occupyingUnit) {
      if (!this.occupyingCiv) this.occupyingCiv = this.occupyingUnit.civ
      else if (this.occupyingCiv !== this.occupyingUnit.civ) {
        n.SendLog("Druga nieznana cywilizacja przejęła miasto cioci poprzedniej cywilizacji.", true)
        this.occupyingCiv = this.occupyingUnit.civ
        this.turns = this.turnsToWin
        return
      }
      this.turns--
      if (this.turns <= 0) {
        n.SendLog(`Cywilizacja o id: ${this.occupyingUnit.civ.id} wygrała gre`, true)
      } else n.SendLog(`Do wygranej poprzez zajęcie miasto cioci zostaje: ${this.turns} tur`, true)
    }



  }

}