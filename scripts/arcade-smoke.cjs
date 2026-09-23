/* Optional browser QA; requires Playwright, Chrome, and the local static server. */
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_PATH
      ? { executablePath: process.env.CHROME_PATH }
      : {}),
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.PORTFOLIO_URL || "http://127.0.0.1:5178/", {
      waitUntil: "networkidle",
    });
    const open = (kind) => page.locator(`[data-hobby="${kind}"]`).click();
    const close = () => page.keyboard.press("Escape");
    await open("drums");
    await page.locator("#drum-record").click();
    await page.keyboard.press("a");
    await page.keyboard.press("s");
    assert.ok((await page.locator(".drum-timeline .recorded").count()) >= 1);
    await page.locator("#drum-record").click();
    assert.equal(await page.locator("#drum-play").isDisabled(), false);
    await page.locator("#drum-play").click();
    assert.match(await page.locator("#drum-play").textContent(), /Stop/);
    await page.locator("#drum-metronome").click();
    assert.equal(
      await page.locator("#drum-metronome").getAttribute("aria-pressed"),
      "true"
    );
    await close();
    await open("dj");
    assert.equal(await page.locator(".dj-step").count(), 48);
    await page.locator("#dj-preset").selectOption("broken");
    await page.locator("#dj-load").click();
    assert.equal(
      await page.locator('[data-track="kick"][aria-pressed="true"]').count(),
      4
    );
    await page.locator("#dj-save").click();
    await page.locator("#dj-play").click();
    await page.locator('[data-mute="hat"]').click();
    assert.equal(
      await page.locator('[data-mute="hat"]').getAttribute("aria-pressed"),
      "true"
    );
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    assert.equal(await page.locator("#hobby-dialog").evaluate(dialog => dialog.open), false);
    await open("dj");
    assert.equal(
      await page.locator('[data-track="kick"][aria-pressed="true"]').count(),
      4
    );
    await page.locator("#dj-clear").click();
    assert.equal(
      await page.locator('.dj-step[aria-pressed="true"]').count(),
      0
    );
    await close();
    await open("jiu");
    for (const answer of [0, 1, 0]) {
      await page.locator(".jiu-choice").nth(answer).click();
      assert.match(
        await page.locator("#jiu-feedback").textContent(),
        /useful practice/
      );
      await page.locator("#jiu-next").click();
    }
    await page.locator("#breathe-start").click();
    assert.match(await page.locator("#breath-status").textContent(), /Cycle 1/);
    await page.locator("#breathe-start").click();
    assert.match(await page.locator("#breath-status").textContent(), /Paused/);
    await close();
    await open("soccer");
    assert.equal(await page.locator("#soccer-precision").isChecked(), true);
    await page.locator("#penalty").click();
    assert.equal(await page.locator("#soccer-precision").isDisabled(), false);
    await page.locator("#soccer-precision").uncheck();
    await page.locator("#soccer-precision").check();
    assert.match(await page.locator("#penalty").textContent(), /Line up/);
    for (const aim of [20, 80, 20, 20, 80]) {
      await page.locator("#penalty").click();
      await page.locator(`[data-aim="${aim}"]`).click();
      await page.locator("#penalty").click();
    }
    assert.match(
      await page.locator("#penalty-result").textContent(),
      /5 out of 5/
    );
    assert.equal(await page.locator(".soccer-scorecard .goal").count(), 5);
    await close();
    await page.locator("#play-game").click();
    await page.locator("#start-game").click();
    await page.keyboard.press("Space");
    assert.match(
      await page.locator("#runner-pulse").textContent(),
      /recharging/
    );
    await page.keyboard.press("p");
    assert.equal(await page.locator("#pause-game").textContent(), "Resume");
    await page.locator("#pause-game").click();
    assert.equal(await page.locator("#pause-game").textContent(), "Pause");
    assert.equal(await page.locator("#game").evaluate(canvas => document.activeElement === canvas), true);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    assert.equal(await page.locator("#pause-game").textContent(), "Resume");
    await close();
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      for (const kind of ["drums", "dj", "jiu", "soccer"]) {
        await open(kind);
        assert.equal(
          await page
            .locator("#hobby-dialog")
            .evaluate((el) => el.scrollWidth > el.clientWidth),
          false,
          `${kind} overflow at ${width}`
        );
        await close();
      }
      await page.locator("#play-game").click();
      assert.equal(
        await page
          .locator("#game-dialog")
          .evaluate((el) => el.scrollWidth > el.clientWidth),
        false,
        `runner overflow at ${width}`
      );
      await close();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await open("dj");
    await page.screenshot({ path: "/tmp/portfolio-arcade-mobile.png" });
    await close();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await open("drums");
    await page.screenshot({ path: "/tmp/portfolio-arcade-desktop.png" });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: drum record/play/metronome, DJ preset/save/mute/clear, Jiu Jitsu choices/breathing, 5-shot soccer/precision, runner pulse/pause/background, all five responsive at 320/390/768px; no page errors."
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
