import City from "../Entity/City";
import { IProduct } from "../Util/GlobalInterfaces";

export interface IBuilder {
  data: IProduct;
  city: City
  Build(): void
}

export class Production {
  public timeLeftToBuild: number;
  private prodLeft: number;
  private city: City

  constructor(public builder: IBuilder) {
    this.city = builder.city
    this.prodLeft = builder.data.production;
    this.timeLeftToBuild = Math.ceil(this.prodLeft / this.city.stats.Get("prod"));
  }

  Next() {
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
