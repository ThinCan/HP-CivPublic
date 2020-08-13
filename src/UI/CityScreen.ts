import { getElement, IScreen } from "./UI";
import City from "../Entity/City";
import { IProduct, IResources, IUnitJson } from "../Util/GlobalInterfaces";
import { GetUnitBuilder } from "../Builders/Units";
import { GetBuildingBuilder } from "../Builders/Buildings";
import { IAsset } from "..";
import { Production } from "../Builders/Builder";
interface ICounter {
  count: HTMLElement;
  inc: HTMLElement;
  dec: HTMLElement;
}
interface IUIElements {
  container: HTMLElement;
  cityName: HTMLElement;
  cityStats: {
    food: HTMLElement;
    pop: HTMLElement;
    prod: HTMLElement;
    grow: HTMLElement;
    ttb: HTMLElement;
  };
  citizens: { [P in keyof (IResources & { prod: number, food: number })]: ICounter } & {
    citizenCount: HTMLElement
  };

  availableBuildings: HTMLElement;
  availableUnits: HTMLElement;
  itemDescription: HTMLElement;
  buildButton: HTMLElement;
}

export default class CityScreen implements IScreen {
  private uielements: IUIElements = {
    container: getElement(".city"),
    cityName: getElement("#city-name"),
    cityStats: {
      food: getElement("#city-food"),
      pop: getElement("#city-pop"),
      prod: getElement("#city-prod"),
      grow: getElement("#city-grow"),
      ttb: getElement("#city-build"),
    },
    citizens: {
      citizenCount: getElement("#citizen-count"),
      prod: {
        count: getElement("#meter-count-prod"),
        inc: getElement("#meter-prod-inc"),
        dec: getElement("#meter-prod-dec"),
      },
      food: {
        count: getElement("#meter-count-pop"),
        inc: getElement("#meter-pop-inc"),
        dec: getElement("#meter-pop-dec"),
      },
      money: {
        count: getElement("#meter-count-money"),
        inc: getElement("#meter-money-inc"),
        dec: getElement("#meter-money-dec"),
      },
      horse: {
        count: getElement("#meter-count-horse"),
        inc: getElement("#meter-horse-inc"),
        dec: getElement("#meter-horse-dec"),
      },
      wood: {
        count: getElement("#meter-count-wood"),
        inc: getElement("#meter-wood-inc"),
        dec: getElement("#meter-wood-dec"),
      },
      iron: {
        count: getElement("#meter-count-iron"),
        inc: getElement("#meter-iron-inc"),
        dec: getElement("#meter-iron-dec"),
      },
      stone: {
        count: getElement("#meter-count-stone"),
        inc: getElement("#meter-stone-inc"),
        dec: getElement("#meter-stone-dec"),
      },
    },
    availableBuildings: getElement(".city-buildings"),
    availableUnits: getElement(".city-units"),
    itemDescription: getElement(".available-item-desc"),
    buildButton: getElement(".available-btn"),
  };
  constructor() {
    getElement(".city-close").onclick = () => this.Close();
  }

  Show(city: City) {
    const stats = city.stats;
    const available = city.available;
    const ui = this.uielements;

    ui.cityName.textContent = city.name;
    ui.cityStats.food.textContent = stats.Get("food").toString();
    ui.cityStats.pop.textContent = stats.Get("pop").toString();
    ui.cityStats.prod.textContent = stats.Get("prod").toString();
    ui.cityStats.grow.textContent = city.timeLeftToGrow.toString();
    ui.cityStats.ttb.textContent =
      city.production?.timeLeftToBuild.toString() || "N/A";

    this.uielements.availableUnits.innerHTML = "";
    this.uielements.availableBuildings.innerHTML = "";
    for (const item of available.keys()) {
      if (!item) continue;
      const container =
        "health" in item ? ui.availableUnits : ui.availableBuildings;
      container.appendChild(this.createListItem(item, city));
    }

    this.addCallbacksToCitizenManagment(city);
    this.updateCitizensOccupied(city);

    ui.container.classList.add("show");
  }
  Close() {
    this.uielements.container.classList.remove("show");
    getElement(".city-close").blur();
  }

  private updateCitizensOccupied(city: City) {
    this.uielements.citizens.citizenCount.textContent = (
      city.stats.Get("pop") - city.assignedCitizens.SumAllValues()
    ).toString();

    for (const [k, v] of city.assignedCitizens.Entries()) {
      this.uielements.citizens[k].count.textContent = v.toString()
    }
  }
  private addCallbacksToCitizenManagment(city: City) {
    for (const key in this.uielements.citizens) {
      //@ts-ignore
      if (!("dec" in this.uielements.citizens[key])) continue;
      //@ts-ignore
      this.uielements.citizens[key].inc.onclick = () => {
        //@ts-ignore
        city.SetCitizen("inc", key);
      };
      //@ts-ignore
      this.uielements.citizens[key].dec.onclick = () => {
        //@ts-ignore
        city.SetCitizen("dec", key);
      };
    }
  }

  private createListItem(item: IProduct, city: City) {
    const li = document.createElement("li"),
      btn = document.createElement("button"),
      imgE = document.createElement("img"),
      span = document.createElement("span");

    li.className = "available-list-item";
    btn.className = "available-list-btn";
    imgE.className = "list-btn-img";
    imgE.src = "./img/zamek.png";
    span.textContent = item.name;
    btn.onclick = () => {
      this.uielements.itemDescription.textContent =
        item.name + ": " + item.desc;
      this.uielements.itemDescription.innerHTML +=
        "<br>Produkcja: " + item.production;

      for (const key in item.cost) {
        const span = document.createElement("span");
        span.style.marginLeft = "5px";
        span.style.color =
          //@ts-ignore
          city.civ.resources.Get(key) >= item.cost[key] ? "green" : "red";
        //@ts-ignore
        span.innerHTML += this.costToName(key) + ": " + item.cost[key];
        this.uielements.itemDescription.appendChild(span);
      }

      this.uielements.buildButton.classList.add("show");
      this.uielements.buildButton.onclick = () => {
        this.uielements.buildButton.classList.remove("show");
        const builder =
          "health" in (item as IProduct)
            ? GetUnitBuilder(item as IUnitJson, city.tile, city)
            : GetBuildingBuilder(item, city);
        city.Build(new Production(builder));
      };
    };
    li.appendChild(btn);
    btn.appendChild(imgE);
    btn.appendChild(span);

    return li;
  }
  private costToName(key: string) {
    switch (key) {
      case "money":
        return "Złoto";
      case "horse":
        return "Konie";
      case "wood":
        return "Drewno";
      case "stone":
        return "Kamień";
      case "iron":
        return "Żelazo";

      default:
        return key;
    }
  }
}
