import { describe, expect, it } from "vitest";
import { detectImageType } from "./image-type";

const bytes = (...values: number[]) => Buffer.from(values);
const withAscii = (head: string, pad = 16) =>
  Buffer.concat([Buffer.from(head, "ascii"), Buffer.alloc(pad)]);

describe("what the bytes actually are", () => {
  it("recognises the four formats the canvas accepts", () => {
    expect(
      detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)),
    ).toBe("image/png");
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(detectImageType(withAscii("GIF89a"))).toBe("image/gif");

    const webp = Buffer.concat([
      Buffer.from("RIFF", "ascii"),
      bytes(0, 0, 0, 0),
      Buffer.from("WEBP", "ascii"),
    ]);
    expect(detectImageType(webp)).toBe("image/webp");
  });
});

describe("what a caller claims", () => {
  // The multipart Content-Type is set by whoever is uploading, so it can say
  // image/png over anything at all.
  it("refuses a payload that is not an image, whatever it was labelled", () => {
    expect(
      detectImageType(Buffer.from("#!/bin/sh\nrm -rf /", "utf8")),
    ).toBeNull();
    expect(detectImageType(Buffer.from("%PDF-1.7", "ascii"))).toBeNull();
    expect(detectImageType(Buffer.from("<svg xmlns=", "ascii"))).toBeNull();
  });

  it("refuses a RIFF container that is not WebP", () => {
    const wav = Buffer.concat([
      Buffer.from("RIFF", "ascii"),
      bytes(0, 0, 0, 0),
      Buffer.from("WAVE", "ascii"),
    ]);
    expect(detectImageType(wav)).toBeNull();
  });

  it("refuses a truncated header rather than reading past the end", () => {
    expect(detectImageType(bytes(0x89, 0x50))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });
});
