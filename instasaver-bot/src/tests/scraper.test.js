import test from "node:test";
import assert from "node:assert";
import { parseUsername, parseShortcode } from "../bot/utils.js";

test("Utils: Should parse username correctly", () => {
  assert.strictEqual(parseUsername("@cristiano"), "cristiano");
  assert.strictEqual(parseUsername("cristiano"), "cristiano");
  assert.strictEqual(
    parseUsername("https://instagram.com/cristiano"),
    "cristiano",
  );
});

test("Utils: Should parse shortcode correctly", () => {
  assert.strictEqual(
    parseShortcode("https://www.instagram.com/p/CXYZ123/"),
    "CXYZ123",
  );
  assert.strictEqual(
    parseShortcode("https://www.instagram.com/reels/CXYZ123/"),
    "CXYZ123",
  );
  assert.strictEqual(
    parseShortcode("https://www.instagram.com/reel/CXYZ123/"),
    "CXYZ123",
  );
});

// Mock tests for scraper since it depends on network
test("Instagram Logic: getUserDP should be defined", async () => {
  const { getUserDP } = await import("../bot/instagram.js");
  assert.strictEqual(typeof getUserDP, "function");
});
