import type { HTTPTransport } from "../../http/transport";
import type { RequestOptions } from "../../types/client";
import type { AudioSpeechCreateParams } from "../../types/audio";
import { Speech, type SpeechResource } from "./speech";
import { Transcriptions } from "./transcriptions";

export { Speech, type SpeechResource } from "./speech";
export { Transcriptions } from "./transcriptions";

export class Audio {
  readonly speech: SpeechResource;
  readonly transcriptions: Transcriptions;

  constructor(transport: HTTPTransport) {
    const speechInstance = new Speech(transport);
    const speechFn = ((params: AudioSpeechCreateParams, options?: RequestOptions) => {
      return speechInstance.create(params, options);
    }) as SpeechResource;

    speechFn.create = (params: AudioSpeechCreateParams, options?: RequestOptions) => {
      return speechInstance.create(params, options);
    };

    this.speech = speechFn;
    this.transcriptions = new Transcriptions(transport);
  }
}
