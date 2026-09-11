import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Zorveus } from "../src/index";

describe("Multimodal Gateway Resources", () => {
  let globalFetch: typeof fetch;

  beforeEach(() => {
    globalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = globalFetch;
  });

  describe("Images", () => {
    it("generates images with prompt and attribution metadata", async () => {
      const mockResponse = {
        created: 1700000000,
        data: [{ url: "https://images.example.com/img_123.png" }]
      };

      let capturedUrl = "";
      let capturedBody: Record<string, unknown> = {};

      global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        capturedUrl = url;
        capturedBody = JSON.parse((init?.body as string) || "{}");

        return new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      });

      const client = new Zorveus({ apiKey: "zrv_test_key" });
      const res = await client.images.generate({
        model: "dall-e-3",
        prompt: "A futuristic skyline",
        zorveusMetadata: {
          externalUserId: "user_42"
        }
      });

      expect(capturedUrl).toContain("/v1/images/generations");
      expect(capturedBody.model).toBe("dall-e-3");
      expect(capturedBody.prompt).toBe("A futuristic skyline");
      expect(capturedBody.metadata).toEqual({
        external_user_id: "user_42"
      });
      expect(res.data[0].url).toBe("https://images.example.com/img_123.png");
    });
  });

  describe("Audio", () => {
    it("generates speech via direct client.audio.speech() call", async () => {
      let capturedUrl = "";
      let capturedBody: Record<string, unknown> = {};

      global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        capturedUrl = url;
        capturedBody = JSON.parse((init?.body as string) || "{}");

        return new Response(new Uint8Array([1, 2, 3, 4]), {
          status: 200,
          headers: { "Content-Type": "audio/mpeg" }
        });
      });

      const client = new Zorveus({ apiKey: "zrv_test_key" });
      const response = await client.audio.speech({
        model: "tts-1",
        voice: "alloy",
        input: "Hello developer"
      });

      expect(capturedUrl).toContain("/v1/audio/speech");
      expect(capturedBody.model).toBe("tts-1");
      expect(capturedBody.voice).toBe("alloy");
      expect(capturedBody.input).toBe("Hello developer");

      const buffer = await response.arrayBuffer();
      expect(new Uint8Array(buffer)).toEqual(new Uint8Array([1, 2, 3, 4]));
    });

    it("generates speech via client.audio.speech.create() call", async () => {
      global.fetch = vi.fn().mockImplementation(async () => {
        return new Response(new Uint8Array([5, 6, 7, 8]), {
          status: 200,
          headers: { "Content-Type": "audio/mpeg" }
        });
      });

      const client = new Zorveus({ apiKey: "zrv_test_key" });
      const response = await client.audio.speech.create({
        model: "tts-1-hd",
        voice: "echo",
        input: "Testing speech.create"
      });

      const buffer = await response.arrayBuffer();
      expect(new Uint8Array(buffer)).toEqual(new Uint8Array([5, 6, 7, 8]));
    });

    it("transcribes audio via client.audio.transcriptions.create()", async () => {
      const mockTranscription = {
        text: "This is a transcribed test sentence."
      };

      let capturedUrl = "";
      let capturedBody: unknown = null;

      global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        capturedUrl = url;
        capturedBody = init?.body;

        return new Response(JSON.stringify(mockTranscription), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      });

      const client = new Zorveus({ apiKey: "zrv_test_key" });
      const fakeBlob = new Blob(["fake audio content"], { type: "audio/wav" });
      const result = await client.audio.transcriptions.create({
        file: fakeBlob,
        model: "whisper-1"
      });

      expect(capturedUrl).toContain("/v1/audio/transcriptions");
      expect(capturedBody).toBeInstanceOf(FormData);
      expect(result.text).toBe("This is a transcribed test sentence.");
    });
  });
});
