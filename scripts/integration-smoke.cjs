/* Tests optional API fallback and journal readers with local fixtures, never paid requests. */
const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.PORTFOLIO_URL || "http://127.0.0.1:5178/";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    let calls = [];
    let fail = false;
    await page.route("**/assets/data/copilot-config.json", (r) =>
      r.fulfill({
        json: { enableAI: true, endpoint: "https://copilot.test/chat" },
      })
    );
    await page.route("https://copilot.test/chat", async (r) => {
      const payload = r.request().postDataJSON();
      calls.push(payload);
      if (fail) {
        await r.fulfill({ status: 503, json: { error: "disabled" } });
        return;
      }
      await r.fulfill({
        json: {
          topicId: payload.topicId,
          answer: "This is a planned weekend concept, not completed work.",
          sources: [],
          cached: false,
        },
      });
    });
    await page.goto(base + "?mission=agent-observatory", {
      waitUntil: "networkidle",
    });
    await page.getByRole("button", { name: "Ask Orbit about this" }).click();
    await page.waitForFunction(() =>
      document
        .querySelector(".chat-message:last-child")
        .textContent.includes("AI SUMMARY")
    );
    assert.deepEqual(calls, [{ topicId: "agent-observatory" }]);
    assert.match(
      await page.locator(".chat-message").last().textContent(),
      /PLANNED CONCEPT · NOT COMPLETED/
    );
    assert.ok(
      await page
        .locator(".chat-message")
        .last()
        .locator(".source-links a")
        .count()
    );
    for (const q of [
      "Who is Taylor Swift?",
      "Tell me about quantum computing",
    ]) {
      await page.locator(".chat-form input").fill(q);
      await page.locator(".chat-form button").click();
      await page.waitForFunction(() =>
        document
          .querySelector(".chat-message:last-child")
          .textContent.includes("general-purpose")
      );
    }
    assert.equal(
      calls.length,
      1,
      "General questions must not trigger remote topic summaries"
    );
    fail = true;
    await page.locator('[data-topic="eox"]').click();
    await page.waitForFunction(() =>
      document
        .querySelector(".chat-message:last-child")
        .textContent.includes("AI UNAVAILABLE")
    );
    assert.match(
      await page.locator(".chat-message").last().textContent(),
      /February 2026/
    );
    assert.equal(calls.length, 2, "Failed provider call is not retried");
    await page.keyboard.press("Escape");
    const photo = fs.readFileSync("assets/images/kj/kshitij.jpeg");
    await page.route("**/assets/images/journal/test.jpg", (r) =>
      r.fulfill({ contentType: "image/jpeg", body: photo })
    );
    await page.route("**/assets/data/journal.json", (r) =>
      r.fulfill({
        json: {
          entries: [
            {
              id: "test-photo-story",
              type: "travel",
              title: "Test journal fixture",
              date: "Test date",
              location: "Test location",
              excerpt: "Local QA only; never published.",
              cover: {
                src: "assets/images/journal/test.jpg",
                alt: "Test image",
              },
              body: ["First test paragraph.", "Second test paragraph."],
              photos: [
                {
                  src: "assets/images/journal/test.jpg",
                  alt: "Test first",
                  caption: "First caption",
                },
                {
                  src: "assets/images/journal/test.jpg",
                  alt: "Test second",
                  caption: "Second caption",
                },
              ],
            },
            {
              id: "test-writing",
              type: "writing",
              title: "Test writing fixture",
              body: ["A test paragraph."],
            },
          ],
        },
      })
    );
    await page.goto(base, { waitUntil: "networkidle" });
    assert.equal(await page.locator(".journal-card").count(), 2);
    await page.locator('[data-journal-filter="travel"]').click();
    assert.equal(await page.locator(".journal-card").count(), 1);
    assert.equal(
      await page.locator(".project:visible").count(),
      6,
      "Journal filters must not affect project filters"
    );
    await page.getByRole("button", { name: /Test journal fixture/ }).click();
    assert.match(
      await page.locator("#journal-body").textContent(),
      /First test paragraph/
    );
    assert.equal(
      await page.locator("#journal-photo-position").textContent(),
      "1 / 2"
    );
    await page.locator("#journal-photo-next").click();
    assert.equal(
      await page.locator("#journal-photo-caption").textContent(),
      "Second caption"
    );
    await page.keyboard.press("ArrowLeft");
    assert.equal(
      await page.locator("#journal-photo-position").textContent(),
      "1 / 2"
    );
    assert.equal(
      await page
        .locator("#journal-dialog")
        .evaluate((d) => d.scrollWidth > d.clientWidth),
      false
    );
    await page.keyboard.press("Escape");
    assert.deepEqual(errors, []);
    console.log(
      "PASS: optional AI topic-only contract, persistent planned badge, no general-query calls, failure fallback/no retry; journal filters, reader, captions and keyboard photo navigation. No paid calls; fixtures not published."
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
