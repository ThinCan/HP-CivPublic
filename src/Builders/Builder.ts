import City from "../Entity/City";
import { IProduct } from "../Util/GlobalInterfaces";
import { Civilization } from "../Civiliziations/Civilization";

export interface IBuilder {
  data: IProduct;
  civ: Civilization
  Build(): void
}

export class Production {
  public timeLeftToBuild: number;
  private prodLeft: number;

  constructor(public builder: IBuilder, public city: City) {
    this.prodLeft = builder.data.production;
    this.timeLeftToBuild = Math.ceil(this.prodLeft / this.city.stats.Get("prod"));
  }

  Next() {
    console.log("Next() -> ", this.city.stats.Get("prod"))
    this.prodLeft -= this.city.stats.Get("prod")

    if (this.prodLeft <= 0) {
      this.builder.Build();

      this.city.built.add(this.builder.data)
      this.city.RemoveAvailable(this.builder.data)
      delete this.city.production
    }

    this.timeLeftToBuild = Math.ceil(this.prodLeft / this.city.stats.Get("prod"));
  }
}
