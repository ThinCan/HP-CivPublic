import City from "../Entity/City";
import {
  IBuildingCallback,
  IBuildingJson,
  IProduct,
  IBuildingData,
} from "../Util/GlobalInterfaces";
import Unit from "../Entity/Unit";

export interface IBuilder {
  data: IProduct;
  Build(): Building | Unit;
}

export class Building {
  constructor(
    private callback: IBuildingCallback,
    public data: IBuildingJson
  ) { }
  GetData(): IBuildingData {
    return this.callback();
  }
}

export class Production {
  public timeLeftToBuild: number;
  private prodLeft: number;

  constructor(public builder: IBuilder, public city: City) {
    this.prodLeft = builder.data.production;
    this.timeLeftToBuild = Math.ceil(this.prodLeft / city.stats.prod);
  }

  Next(): boolean {
    this.prodLeft -= this.city.stats.prod;
    if (this.prodLeft <= 0) {
      const building = this.builder.Build();
      if (building instanceof Unit) this.city.civ.AddEntity(building);
      else {
        this.city.built.push(building)
        this.city.RemoveAvailable(building.data.name)
      }
      return true;
    }
    this.timeLeftToBuild = Math.ceil(this.prodLeft / this.city.stats.prod);
    return false;
  }
}
