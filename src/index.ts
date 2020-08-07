import Map from "./Map";
import { UI } from "./UI/UI";
import { Civilization } from "./Civiliziations/Civilization";
import NetworkManager from "./NetworkManager";

export interface IAsset {
  Osadnik: HTMLImageElement;
  Robotnik: HTMLImageElement;
  Lucznik: HTMLImageElement;
  Kusznik: HTMLImageElement;
  Wojownik: HTMLImageElement;
  Taran: HTMLImageElement;
  Docent: HTMLImageElement;
  Katapulta: HTMLImageElement;
  Armata: HTMLImageElement;
  Konny: HTMLImageElement;
  Rydwan: HTMLImageElement;
  Rycerz: HTMLImageElement;

  Miasto: HTMLImageElement;
}

export class Game {
  canvas: HTMLCanvasElement;
  c: CanvasRenderingContext2D;
  assets: IAsset = {} as IAsset;

  map: Map;
  ui: UI;
  network: NetworkManager

  mainCiv: Civilization;
  civilizations: Civilization[] = [];

  constructor(public size: { x: number; y: number }) {
    this.canvas = document.querySelector("canvas");
    this.c = this.canvas.getContext("2d", { alpha: false });
    this.ui = new UI(this);
    this.map = new Map(this, this.size.x, this.size.y);
    this.network = new NetworkManager(this)
    window.onresize = () => {
      this.canvas.width = document.body.clientWidth;
      this.canvas.height = document.body.clientHeight - 200;
    };
    (window.onresize as () => void)();
  }

  async Start() {
    this.Update();
  }
  private Update() {
    this.c.fillStyle = "black";
    this.c.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.c.save();
    this.c.translate(this.map.translate.x, this.map.translate.y);
    this.c.scale(this.map.scale.x, this.map.scale.y / 2);

    this.map.Update();

    this.mainCiv.Update();
    this.civilizations.forEach((c) => c.Update());

    this.c.restore();

    requestAnimationFrame(() => this.Update());
  }
  MainCivAction() {
    this.mainCiv.NextAction()
  }
  NextTurn() {
    this.mainCiv.NextTurn();
    this.civilizations.forEach((t) => t.NextTurn());
    this.ui.NextTurn();
    this.mainCiv.NextAction()
  }
  AddCiv(civ: Civilization) {
    this.civilizations.push(civ);
  }
  async LoadAssets(srcs: { [key in keyof IAsset]: string }) {
    await Promise.all(
      Object.keys(srcs).map((e) => {
        return new Promise((res, rej) => {
          const img = new Image();
          img.src = "./img/" + srcs[e as keyof IAsset] + ".png";
          img.onload = () => {
            this.assets[e as keyof IAsset] = img;
            res();
          };
        });
      })
    );
  }
}

const game = new Game({ x: 100, y: 100 });

game
  .LoadAssets({
    Miasto: "city",
    Osadnik: "settler",
    Robotnik: "units/worker",
    Lucznik: "units/archer",
    Kusznik: "units/crossbowman",
    Wojownik: "units/warrior",
    Taran: "units/taran",
    Docent: "units/docent",
    Katapulta: "units/catapult",
    Armata: "units/cannon",
    Konny: "units/cavalry",
    Rycerz: "units/knight",
    Rydwan: "units/chariot",
  })
/*
console.clear();
console.warn("ADD IMAGE FOR TARAN!!");


 */