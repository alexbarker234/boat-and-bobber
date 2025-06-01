import { Schema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 5;
  @type("number") z: number = 10;

  @type("number") rotationX: number = 0;
  @type("number") rotationY: number = 0;

  @type("string") id: string = "";
  @type("boolean") connected: boolean = true;
}
