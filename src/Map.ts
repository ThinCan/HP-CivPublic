import Tile, { TileType } from "./Tile";
import { Game } from ".";
import TileModifier from "./json/modifiers.json";
import { IModifier, SerializedTile } from "./Util/GlobalInterfaces";

interface IMouseCords {
  clientX: number;
  clientY: number;
}

export default class Map {
  //#region properties
  tiles: Tile[][];
  scale = { x: 1, y: 1 };
  translate = { x: 0, y: 0 };
  translateSpeed = { x: 0, y: 0 };
  translateMult = 1;
  isMouseDown = false;
  isMouseDragging = false;
  dragOrigin: { x: number; y: number; tx: number; ty: number };
  size: { x: number; y: number };
  interpolateTo: { x: number; y: number; ox: number; oy: number };

  readonly canvas: HTMLCanvasElement;
  readonly c: CanvasRenderingContext2D;
  //#endregion

  constructor(public game: Game, x: number, y: number) {
    this.size = { x, y };
    this.canvas = game.canvas;
    this.c = game.c;
    this.canvas.addEventListener("click", (ev) => this.onClick(ev));
    window.addEventListener("keydown", (ev) => this.onKeyDown(ev));
    window.addEventListener("keyup", (ev) => this.onKeyUp(ev));
    window.addEventListener("keypress", (ev) => this.onKeyPress(ev));
    this.canvas.addEventListener("mousedown", (ev) => this.onMouseDown(ev));
    this.canvas.addEventListener("mouseup", (ev) => this.onMouseUp(ev));
    this.canvas.addEventListener("mousemove", (ev) => this.onMouseMove(ev));
    this.canvas.addEventListener("wheel", (ev) => this.onWheel(ev));

    this.tiles = new Array(y).fill(0).map(() => new Array(x));

    for (let j = 0; j < y; j++)
      for (let i = 0; i < x; i++)
        this.tiles[j][i] = new Tile(this, { x: j, y: i });

    this.createLands();
  }
  ToLocal(x: number, y: number) {
    return {
      x: (x - this.translate.x) / this.scale.x,
      y: (y - this.translate.y) / (this.scale.y / 2),
    };
  }
  Update() {
    if (this.interpolateTo) {
      this.translate.x += (this.interpolateTo.x - this.interpolateTo.ox) * 0.04;
      this.translate.y += (this.interpolateTo.y - this.interpolateTo.oy) * 0.04;
      if (
        Math.hypot(
          this.translate.x - this.interpolateTo.x,
          this.translate.y - this.interpolateTo.y
        ) < 1
      ) {
        this.translate.x = this.interpolateTo.x;
        this.translate.y = this.interpolateTo.y;
        delete this.interpolateTo;
      }
    }

    this.Draw();
  }
  private Draw() {
    this.translate.x += this.translateSpeed.x * this.translateMult;
    this.translate.y += this.translateSpeed.y * this.translateMult;

    for (let i = 0; i < this.tiles.length; i++) {
      for (let j = 0; j < this.tiles[i].length; j++) {
        this.tiles[i][j].Draw();
      }
    }
  }

  //#region User Events
  private onClick({ clientX, clientY }: { clientX: number; clientY: number }) {
    if (this.isMouseDragging) return;

    const { x, y } = this.ToLocal(clientX, clientY);
    const tile = this.tilesArray.find((t) => t.Dist({ x, y }) < Tile.sizet);
    tile?.MouseClick();
  }
  private onKeyDown(ev: KeyboardEvent) {
    const k = ev.key.toLowerCase();
    const speed = 15;
    if (k === "d") this.translateSpeed.x = -speed;
    else if (k === "a") this.translateSpeed.x = speed;
    else if (k === "w") this.translateSpeed.y = speed;
    else if (k === "s") this.translateSpeed.y = -speed;
    else if (k === "shift") this.translateMult = 2;
    else if (k === "escape") {
      this.game.mainCiv.DeselectLastEntity();
      this.game.ui.HideCity();
    }
  }
  private onKeyUp(ev: KeyboardEvent) {
    const k = ev.key.toLowerCase();
    if (k === "d" && this.translateSpeed.x < 0) this.translateSpeed.x = 0;
    else if (k === "a" && this.translateSpeed.x > 0) this.translateSpeed.x = 0;
    else if (k === "w" && this.translateSpeed.y > 0) this.translateSpeed.y = 0;
    else if (k === "s" && this.translateSpeed.y < 0) this.translateSpeed.y = 0;
    else if (k === "shift") this.translateMult = 1;
  }
  private onKeyPress(ev: KeyboardEvent) {
    const k = ev.key.toLowerCase();
    if (k === " ") this.game.MainCivAction();
  }
  private onMouseDown({ clientX, clientY }: IMouseCords) {
    this.isMouseDragging = false;
    this.dragOrigin = {
      x: clientX,
      y: clientY,
      tx: this.translate.x,
      ty: this.translate.y,
    };
    this.isMouseDown = true;
  }
  private onMouseUp({ clientX, clientY }: IMouseCords) {
    this.isMouseDown = false;
    delete this.dragOrigin;
    if (this.interpolateTo) this.Focus(this.interpolateTo);
  }
  private onMouseMove({ clientX, clientY }: IMouseCords) {
    if (this.isMouseDown === false) return;
    const distX = clientX - this.dragOrigin.x;
    const distY = clientY - this.dragOrigin.y;
    if (Math.abs(distX) + Math.abs(distY) < Tile.sizet) return;

    if (this.interpolateTo) delete this.interpolateTo;
    this.isMouseDragging = true;
    this.translate.x = this.dragOrigin.tx + distX;
    this.translate.y = this.dragOrigin.ty + distY;
  }
  private onWheel({ deltaY }: WheelEvent) {
    if (
      (this.scale.x >= 0.8 && deltaY > 0) ||
      (this.scale.x <= 0.4 && deltaY < 0)
    )
      return;

    const [cx, cy] = [
      (-this.translate.x + this.canvas.width / 2) / this.scale.x,
      ((-this.translate.y + this.canvas.height / 2) / this.scale.y) * 2,
    ];

    deltaY /= 500;
    this.scale.x += deltaY;
    this.scale.y += deltaY;
    this.Focus({ x: cx, y: cy }, false);
  }
  //#endregion

  private createLands() {
    //@ts-ignore
    noise.seed(Math.random());
    const scale = 40;
    //@ts-ignore
    const gn = (i, j, s) => noise.perlin2(i / (scale / s), j / (scale / s));
    const sx = this.size.x;
    const sy = this.size.y;

    for (let i = 0; i < this.size.y; i++) {
      for (let j = 0; j < this.size.x; j++) {
        let noise = gn(i, j, 1) + gn(i, j, 2) / 2 + gn(i, j, 4) / 4;
        if (i <= 20) noise -= 1 - i / 20;
        else if (i > sy - 20) noise -= 1 - (sy - i) / 20;
        if (j <= 20) noise -= 1 - j / 20;
        else if (j > sx - 20) noise -= 1 - (sx - j) / 20;

        let val = noise;
        const tile = this.tiles[i][j];

        if (val < -0.2) tile.type = TileType.Woda;
        else if (val < -0.17) tile.type = TileType.Piasek;
        else if (val < 0.25) tile.type = TileType.Ziemia;
        else if (val < 0.35) tile.type = TileType.Ciemnaziemia;
        else if (val < 0.9) tile.type = TileType.Skała;
        else tile.type = TileType.Śnieg;
      }
    }

    const ta = this.tilesArray;
    const stoneTiles = ta.filter((t) => t.type === TileType.Skała),
      greenTiles = ta.filter((t) => t.type === TileType.Ziemia),
      dgreenTiles = ta.filter((t) => t.type === TileType.Ciemnaziemia);

    if (stoneTiles.length < 350) {
      ta.forEach((t) => {
        t.modifier = undefined;
      });
      this.createLands();
      return;
    }

    this.GenerateResources(stoneTiles, TileModifier.stone);
    this.GenerateResources(stoneTiles, TileModifier.iron);

    this.GenerateResources(dgreenTiles, TileModifier.forest, 0.07);

    this.GenerateResources(greenTiles, TileModifier.horse, 0.005);
    this.GenerateResources(greenTiles, TileModifier.wheat, 0.01);
    this.GenerateResources(greenTiles, TileModifier.iron, 0.005);
    this.GenerateResources(greenTiles, TileModifier.stone, 0.005);
    this.GenerateResources(greenTiles, TileModifier.forest, 0.004);
    this.GenerateResources(greenTiles, TileModifier.iron, 0.001);

    const groundTiles = this.tilesArray.filter(
      (t) => t.type !== TileType.Woda && !t.modifier
    );
    const mineralTile = this.RandomItem(groundTiles);
    mineralTile.modifier = TileModifier.mineral;
    mineralTile.displayModifier = false;
  }

  GenerateResources(arr: Tile[], res: IModifier, size = 0.07) {
    for (let i = 0; i < Math.ceil(arr.length * size);) {
      const tile = this.RandomItem(arr);
      if (tile.modifier) continue;
      tile.modifier = res;
      i++;
    }
  }
  get tilesArray() {
    const tiles = [];
    for (let i = 0; i < this.size.y; i++)
      for (let j = 0; j < this.size.x; j++) tiles.push(this.tiles[i][j]);
    return tiles;
  }
  RandomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  Focus(pos: { x: number; y: number }, interpolate = true) {
    const destination = {
      x: -pos.x * this.scale.x + this.canvas.width / 2,
      y: -pos.y * (this.scale.y / 2) + this.canvas.height / 2,
    };

    if (!interpolate) {
      this.translate = { x: destination.x, y: destination.y };
    } else {
      this.interpolateTo = {
        x: destination.x,
        y: destination.y,
        ox: this.translate.x,
        oy: this.translate.y,
      };
    }
  }
  LoadMap(map: SerializedTile[]) {
    for (const tile of map) {
      const { x: mx, y: my } = tile.mapPos
      this.tiles[mx][my].LoadData(tile)
    }
  }
  UpdateTileData(data: SerializedTile) {
    this.LoadMap([data])
  }
}
