import { Ruler } from "../rules/ruler";
import { StateCore } from "../state/core";

export class ParserCore {
  ruler = new Ruler();

  ruler2 = new Ruler();

  State = StateCore;

  process(state: StateCore) {
    throw new Error("Method not implemented.");
  }
}
