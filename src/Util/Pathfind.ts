import Tile from "../Tile";

type heappair = [number, Tile];
class MinHeap {
  private arr: heappair[] = [];

  parent(i: number) {
    return Math.floor((i - 1) / 2);
  }
  leftChild(i: number) {
    return i * 2 + 1;
  }
  rightChild(i: number) {
    return i * 2 + 2;
  }
  swap(a: number, b: number) {
    const temp = this.arr[a];
    this.arr[a] = this.arr[b];
    this.arr[b] = temp;
  }
  insert(value: heappair) {
    let index = this.arr.length;
    let parent = this.parent(index);
    this.arr[index] = value;

    if (!index) return;
    while (parent > -1 && this.arr[parent][0] > this.arr[index][0]) {
      this.swap(parent, index);
      index = parent;
      parent = this.parent(index);
    }
  }
  remove() {
    if (this.arr.length === 0) return;

    const arr = this.arr;
    const root = arr[0];
    arr[0] = arr.pop() as heappair;

    let index = 0,
      leftIndex = this.leftChild(index),
      rightIndex = this.rightChild(index);

    while (
      (arr[leftIndex] && arr[leftIndex][0] < arr[index][0]) ||
      (arr[rightIndex] && arr[rightIndex][0] < arr[index][0])
    ) {
      if (arr[leftIndex][0] < arr[index][0]) {
        this.swap(leftIndex, index);
        index = leftIndex;
      } else {
        this.swap(rightIndex, index);
        index = rightIndex;
      }
      leftIndex = this.leftChild(index);
      rightIndex = this.rightChild(index);
    }

    return root;
  }
  get size() {
    return this.arr.length;
  }
}

export abstract class Astar {
  private static h(tile: Tile, goal: Tile) {
    return tile.Dist(goal);
  }
  private static f(g: number, h: number) {
    return g + h;
  }

  static findPath(start: Tile, goal: Tile) {
    const heap = new MinHeap();
    const gs = new Map<Tile, number>();
    const history = new Map<Tile, Tile>();

    heap.insert([Astar.h(start, goal), start]);
    gs.set(start, 0);

    while (heap.size > 0) {
      const curr = heap.remove() as heappair;
      const cf = curr[0],
        ct = curr[1];

      if (ct === goal) break;
      /* if (ct.type === TileType.WODA) continue; */

      for (const neighbor of ct.GetAdj()) {
        const ng = <number>gs.get(ct) + 1; /*  neighbor.weight; */

        if (!gs.has(neighbor) || ng < <number>gs.get(neighbor)) {
          gs.set(neighbor, ng);
          const fcost = this.f(ng, Astar.h(neighbor, goal));
          heap.insert([fcost, neighbor]);
          history.set(neighbor, ct);
        }
      }
    }

    const path: Tile[] = [goal];
    let tile = goal;
    while (tile) {
      const lastItem = path.length - 1;
      tile = path[lastItem];
      if (tile === start) break;
      path.push(<Tile>history.get(tile) || start);
    }

    return path;
  }
}
