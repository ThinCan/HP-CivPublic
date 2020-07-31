import { IScreen, getElement } from "./UI";
import Unit, { IUnitAction } from "../Entity/Unit";

export default class UnitScreen implements IScreen {
  private uielements = {
    container: getElement(".actions-container"),
    unitInfo: getElement("#unit-info"),
  };

  Show(unit: Unit) {
    this.uielements.container.innerHTML = "";
    this.uielements.unitInfo.innerHTML = "";

    unit.walkingRange > 0 &&
      unit.actions.forEach((e) =>
        this.uielements.container.appendChild(this.getActionButton(e))
      );

    this.addToUnitInfo(unit);
  }
  Close() {
    this.uielements.container.innerHTML = "";
    this.uielements.unitInfo.innerHTML = "";
  }

  private getActionButton(action: IUnitAction) {
    const btn = document.createElement("button");
    const img = document.createElement("img");
    const span = document.createElement("span");

    btn.className = "action-btn";
    img.className = "action-img";
    span.textContent = action.desc;
    btn.onclick = () => action.execute();
    img.src = action.img;
    btn.appendChild(img);
    btn.appendChild(span);
    return btn;
  }
  private addToUnitInfo(unit: Unit) {
    const {
      health,
      fullHealth,
      defense,
      attack,
      data: { desc, name },
    } = unit;

    const l1 = document.createElement("li"),
      l2 = document.createElement("li"),
      l3 = document.createElement("li"),
      l4 = document.createElement("li");

    l1.textContent = `Życie: ${health}/${fullHealth}`;
    l2.textContent = `Obrona: ${defense}`;
    l3.textContent = `Obrażenia: ${attack}`;
    l4.textContent = `${name}: ${desc}`;
    this.uielements.unitInfo.appendChild(l1);
    this.uielements.unitInfo.appendChild(l2);
    this.uielements.unitInfo.appendChild(l3);
    this.uielements.unitInfo.appendChild(l4);
  }
  public addInfoToPanel(text: string) {
    const li = document.createElement("li");
    li.textContent = text;
    this.uielements.unitInfo.appendChild(li);
  }
}

interface IUnitData {
  health: number;
  fullHealth: number;
  defense: number;
  attack: number;
  name: string;
  desc: string;
}
