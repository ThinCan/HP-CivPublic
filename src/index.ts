import Map from "./Map";
import { UI } from "./UI/UI";
import { Civilization } from "./Civiliziations/Civilization";
import { TileType } from "./Tile";
import City from "./Entity/City";
import { GetUnitBuilder } from "./Builders/Units";
import * as Units from "./json/units.json";
import { GetBuildingBuilder } from "./Builders/Buildings";
import { IBuildingJson } from "./Util/GlobalInterfaces";
import { Building } from "./Builders/Builder";

export interface IAsset {
  settler: HTMLImageElement;
  worker: HTMLImageElement;
  archer: HTMLImageElement;
  warrior: HTMLImageElement;
  taran: HTMLImageElement;
  docent: HTMLImageElement;

  city: HTMLImageElement;
}

export class Game {
  canvas: HTMLCanvasElement;
  c: CanvasRenderingContext2D;
  assets: IAsset = {} as IAsset;

  map: Map;
  ui: UI;

  mainCiv: Civilization;
  private civilizations: Civilization[] = [];

  constructor(public size: { x: number; y: number }) {
    this.canvas = document.querySelector("canvas");
    this.c = this.canvas.getContext("2d", { alpha: false });
    this.ui = new UI(this);
    window.onresize = () => {
      this.canvas.width = document.body.clientWidth;
      this.canvas.height = document.body.clientHeight - 200;
    };
    (window.onresize as () => void)();
  }

  async Start() {
    this.map = new Map(this, this.size.x, this.size.y);
    this.mainCiv = new Civilization(this, "fornal", "red", true);
    this.AddCiv(new Civilization(this, "asd", "purple"));

    const rtile = this.map.RandomItem(
      this.map.tilesArray.filter((t) => t.type === TileType.Ziemia)
    );

    //this.mainCiv.AddEntity(new City(rtile, this.assets.city, this.mainCiv));
    this.mainCiv.AddEntity(
      GetUnitBuilder(
        Units.find((t) => t.name === "Łucznik"),
        this.mainCiv,
        this.map.RandomItem(rtile.GetAdj())
      ).Build()
    );
    this.mainCiv.AddEntity(
      GetUnitBuilder(
        Units.find((t) => t.name === "Łucznik"),
        this.civilizations[0],
        this.map.RandomItem(rtile.GetAdj())
      ).Build()
    );
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
  NextTurn() {
    if (this.civilizations.every((t) => t.ready) && this.mainCiv.ready) {
      this.mainCiv.NextTurn();
      this.civilizations.forEach((t) => t.NextTurn());
      this.ui.NextTurn();
    } else {
      this.mainCiv.NextAction();
    }
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
    settler: "settler",
    city: "city",
    worker: "units/worker",
    archer: "units/archer",
    warrior: "units/warrior",
    taran: "units/warrior",
    docent: "units/docent",
  })
  .then(() => {
    game.Start();
    require("./json/citybuilding.json").forEach((e: any) => {
      /*     const city = game.mainCiv.cities[0];
      city.built.push(GetBuildingBuilder(e as IBuildingJson, city).Build() as Building); */
    });
  });

console.clear();
console.warn("ADD IMAGE FOR TARAN!!");
