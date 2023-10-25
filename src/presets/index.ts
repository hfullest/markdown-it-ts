import _default from "./default";
import zero from "./zero";
import commonmark from "./commonmark";
import { PresetNameType, Config } from "../interface";

export default { default: _default, zero, commonmark } as Record<
  PresetNameType,
  Config
>;
