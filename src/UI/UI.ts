import Unit from "../Entity/Unit";
import City from "../Entity/City";
import CityScreen from "./CityScreen";
import UnitScreen from "./UnitScreen";
import { Game } from "..";
import { IResources } from "../Util/GlobalInterfaces";
import { Civilization } from "../Civiliziations/Civilization";
import { Entity } from "../Entity/Entity";
import LoginScreen from "./LoginScreen";

interface IUIItems {
  actionLog: HTMLElement;
  turn: HTMLElement;
  gameContainer: HTMLElement;
  resources: { [Key in keyof IResources]: { container: HTMLElement; income: HTMLElement } }
}

export class UI {
  private uiitems: IUIItems = {
    actionLog: getElement("#action-log"),
    turn: getElement("#res-turn"),
    gameContainer: getElement(".game-container"),

    resources: {
      money: {
        container: getElement("#res-gold"),
        income: getElement("#res-gold-p"),
      },
      wood: {
        container: getElement("#res-wood"),
        income: getElement("#res-wood-p"),
      },
      stone: {
        container: getElement("#res-stone"),
        income: getElement("#res-stone-p"),
      },
      iron: {
        container: getElement("#res-iron"),
        income: getElement("#res-iron-p"),
      },
      horse: {
        container: getElement("#res-horse"),
        income: getElement("#res-horse-p"),
      },
      mineral: {
        container: getElement("#res-mineral"),
        income: getElement("#res-mineral-p"),
      },
    },
  }

  private _turn = 1;
  private selectedEntity: Entity;

  private cityScreen = new CityScreen();
  private unitScreen = new UnitScreen();
  public loginScreen = new LoginScreen(this);

  constructor(public game: Game) {
    this.uiitems.gameContainer.style.display = "none"
  }

  ShowUnit(unit: Unit) {
    this.unitScreen.Show(unit);
  }
  HideUnit() {
    this.unitScreen.Close();
  }
  ShowCity(city: City) {
    this.cityScreen.Show(city);
    this.UpdateResources(city.civ);
  }
  HideCity() {
    this.cityScreen.Close();
  }

  UpdateResources(civ: Civilization) {
    for (const [k, v] of civ.resources.Entries()) {
      this.uiitems.resources[k].container.textContent = v.toString()
    }
    const income = civ.GetResourcesIncome()
    for (const key in income) {
      //@ts-ignore
      this.uiitems.resources[key].income.textContent =
        //@ts-ignore
        income[key] > 0 ? `(+${income[key].toFixed(2)})` : `(-${income[key].toFixed(2)})`
    }
  }
  public NextTurn() {
    this.uiitems.turn.textContent = (++this._turn).toString();
    this.UpdateResources(this.game.mainCiv);
  }
  public HideEntity() {
    this.selectedEntity && this.selectedEntity.Deselect();
  }
  public appendToActionLog(text: string) {
    const al = this.uiitems.actionLog;
    const li = document.createElement("li");
    li.textContent = text;
    al.insertBefore(li, al.firstChild);
  }
}

export function getElement<T extends HTMLElement>(selector: string): T {
  const ele = document.querySelector(selector) as T;
  if (!ele) throw new Error("Could not find element with: " + selector);
  else return ele;
}

export interface IScreen {
  Show(entity: Entity): void;
  Close(): void;
}
