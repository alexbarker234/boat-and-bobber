import { Collider, RigidBody } from "@dimforge/rapier3d-compat";
import { Entity } from "./entity";

export abstract class PhysicsEntity extends Entity {
  abstract rigidBody: RigidBody;
  abstract collider: Collider;
}
