import type { HTTPTransport } from "../../http/transport";
import { Completions } from "./completions";

export class Chat {
  readonly completions: Completions;

  constructor(transport: HTTPTransport) {
    this.completions = new Completions(transport);
  }
}
