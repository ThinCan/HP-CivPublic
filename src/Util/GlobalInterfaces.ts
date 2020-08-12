import Tile from "../Tile";
import City, { TAssignedCitizen } from "../Entity/City";
import CivsJSON from "../json/civinfo.json"

export interface IData {
  prod: number;
  food: number;
  pop: number;
}
export type IBuildingData = Partial<IData & IResources>;
export type Partial<T> = {
  [P in keyof T]?: T[P];
};
export interface IModifier {
  img: string;
  weight?: number;
}
export interface IResources {
  stone: number;
  iron: number;
  wood: number;
  money: number;
  horse: number;
  mineral?: number;
}
export interface IAdjTiles {
  t?: Tile;
  b?: Tile;
  tr?: Tile;
  tl?: Tile;
  br?: Tile;
  bl?: Tile;
}
export interface IBuildingCallback {
  (): Partial<IData>;
}
export interface IProduct {
  production: number;
  name: string;
  desc: string;
  requires: string[];
  cost: Partial<IResources>;
}
export interface IUnitJson extends IProduct {
  health: number;
  defense: number;
  attack: number;
}
export interface IBuildingJson extends IProduct { }

export interface SerializedTile {
  type: number;
  pos: { x: number, y: number };
  mapPos: { x: number, y: number };
  displayModifier: boolean;
  modifier: IModifier;
}

export interface SerializedCity {
  mapPos: { x: number, y: number };
  tiles: { x: number, y: number }[];
  stats: { pop: number, food: number };
  defense: number;
  prod: string;
  built: string[];
  available: string[];
  assignedCitizens: TAssignedCitizen;
  resourceBuildings: IResources;
  growthFactor: number;
  maxCitizens: number;
  timeLeftToGrow: number;

}

export interface IPickedCivilization {
  id?: number;
  leader: string;
  desc: string;
  color: string;
  civname: keyof typeof CivsJSON;
}