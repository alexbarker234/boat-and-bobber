import { Schema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 5;
  @type("number") z: number = 10;

  @type("number") quaternionX: number = 0;
  @type("number") quaternionY: number = 0;
  @type("number") quaternionZ: number = 0;
  @type("number") quaternionW: number = 1;

  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") color: string = "";
  @type("boolean") connected: boolean = true;
}
