import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs";

const origin = process.env.APP_URL || "http://127.0.0.1:3000";
const capture = process.argv.includes("--capture-product");
const captureHero = process.argv.includes("--capture-hero");
fs.mkdirSync("verification", { recursive: true });
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const browser = await chromium.launch({ headless: true, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, colorScheme: "dark", reducedMotion: "reduce" });
await context.addInitScript(() => localStorage.setItem("agentcaps-theme", "dark"));
const page = await context.newPage();
const errors = [];
const hydrationErrors = [];
const apiRequests = [];
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => { if (message.type() === "error" && /hydration|hydrated|server rendered/i.test(message.text())) hydrationErrors.push(message.text()); });
page.on("request", request => { if (/\/api\/(config|workspace)/.test(request.url())) apiRequests.push(request.url()); });
const results = { checks: [], screenshots: [] };
async function check(name, action) { await action(); results.checks.push(name); console.log("PASS " + name); }
async function visit(route) {
  const response = await page.goto(origin + route, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.locator("h1").waitFor({ timeout: 60_000 });
  await page.waitForLoadState("load");
  await page.evaluate(() => document.fonts.ready);
  if (route.startsWith("/app")) await page.locator("[data-config-loading]").waitFor({ state: "hidden", timeout: 60_000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return response;
}
async function screenshot(name) {
  if (await page.locator("main img").count()) {
    await page.locator("main img").first().scrollIntoViewIfNeeded();
    await page.locator("main img").evaluateAll(elements => Promise.all(elements.map(element => element.decode())));
    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await page.screenshot({ path: "verification/" + name + ".png", fullPage: true, caret: "initial" });
  results.screenshots.push(name + ".png");
}

try {
  if (captureHero) {
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 960 });
      await visit("/");
      const name = `landing-hero-${width}.png`;
      await page.screenshot({ path: "verification/" + name, caret: "initial" });
      results.screenshots.push(name);
    }
    results.passed = true;
    console.log("Captured the landing hero at desktop and mobile widths.");
  } else if (capture) {
    fs.mkdirSync("public/images", { recursive: true });
    await visit("/app");
    await page.getByRole("button", { name: "Connect wallet", exact: true }).first().waitFor();
    await page.locator("[data-config-loading]").waitFor({ state: "hidden", timeout: 60_000 });
    const bounds = await page.locator("main").boundingBox();
    assert.ok(bounds, "The budgets page must be visible before capture.");
    await page.screenshot({ path: "public/images/workspace.png", caret: "initial", clip: { x: bounds.x, y: bounds.y, width: bounds.width, height: Math.min(820, bounds.height) } });
    await screenshot("app-product-capture");
    console.log("Captured the actual Base Sepolia budgets page. No wallet balances or tasks were invented.");
    results.passed = true;
  } else {
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 960 });
      for (const route of ["/", "/guide", "/app", "/app/receipts", "/app/settings"]) {
        const response = await visit(route);
        await check(route + " at " + width + "px loads and fits", async () => {
          assert.equal(response.status(), 200);
          assert.equal(await page.locator("h1").count(), 1);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
          assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme), "light");
          assert.equal(await page.getByRole("button", { name: /Use (dark|light) theme/ }).count(), 0);
          assert.doesNotMatch(await page.locator("body").innerText(), /demo wallet|local development demo|sample report|payment scenario|workspace/i);
        });
        if (width === 1440 || width === 390) {
          await screenshot((route === "/" ? "landing" : route.slice(1).replaceAll("/", "-")) + "-" + width);
          if (route === "/") {
            await page.screenshot({ path: `verification/landing-hero-${width}.png`, caret: "initial" });
            results.screenshots.push(`landing-hero-${width}.png`);
          }
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 960 });
    await visit("/");
    await check("the real product screenshot loads", async () => {
      await page.locator("main img").first().scrollIntoViewIfNeeded();
      const images = page.locator("main img");
      assert.equal(await images.count(), 1);
      await images.evaluateAll(elements => Promise.all(elements.map(element => element.decode())));
      assert.equal(await images.evaluateAll(elements => elements.every(element => element.naturalWidth > 0)), true);
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await check("primary CTA is visible in the first viewport", async () => {
      const bounds = await page.locator(".hero-copy").getByRole("link", { name: "Manage budgets", exact: true }).boundingBox();
      assert.ok(bounds && bounds.y + bounds.height < 960);
    });
    await check("headline stays on two lines at desktop", async () => {
      const heading = page.locator("h1");
      const lines = await heading.evaluate(element => element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight));
      assert.ok(lines <= 2.05);
    });
    await check("Manrope is loaded from the local font", async () => {
      assert.match(await page.evaluate(() => getComputedStyle(document.body).fontFamily), /manrope/i);
    });
    await check("budget controls support selection and keyboard navigation", async () => {
      const caps = page.getByRole("tab", { name: "Spending caps", exact: true });
      await caps.click();
      await caps.press("ArrowDown");
      assert.equal(await page.getByRole("tab", { name: "Approved recipients", exact: true }).getAttribute("aria-selected"), "true");
      assert.match(await page.locator("#control-panel").innerText(), /Choose who the agent can pay/);
      await page.getByRole("tab", { name: "Approved recipients", exact: true }).press("End");
      assert.equal(await page.getByRole("tab", { name: "Expiry & revocation", exact: true }).getAttribute("aria-selected"), "true");
      await page.getByRole("tab", { name: "Expiry & revocation", exact: true }).press("Home");
    });
    await check("budget lifecycle tabs explain each step", async () => {
      const create = page.getByRole("tab", { name: "01 Create", exact: true });
      await create.click();
      await create.press("ArrowRight");
      assert.match(await page.locator("#process-panel").innerText(), /Approve the amount/);
      await page.getByRole("tab", { name: "02 Fund", exact: true }).press("End");
      assert.match(await page.locator("#process-panel").innerText(), /Return the unused USDC/);
    });
    await check("marketing does not initialize wallet data requests", async () => {
      apiRequests.length = 0;
      await visit("/guide");
      await visit("/");
      assert.equal(apiRequests.length, 0);
    });
    await page.locator(".hero-copy").getByRole("link", { name: "Manage budgets", exact: true }).click();
    await page.waitForURL(origin + "/app");
    await check("landing CTA opens Budgets", async () => assert.equal(await page.getByRole("heading", { name: "Budgets", exact: true }).count(), 1));
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Payments", exact: true }).click();
    await page.waitForURL(origin + "/app/receipts");
    await check("receipts navigation opens its own page", async () => assert.equal(await page.locator('a[aria-current="page"]').textContent(), "Payments"));
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Settings", exact: true }).click();
    await page.waitForURL(origin + "/app/settings");
    await page.reload({ waitUntil: "domcontentloaded" });
    await check("settings supports direct links and refresh", async () => {
      await page.getByRole("heading", { name: "Settings", exact: true }).waitFor();
      assert.equal(await page.getByRole("heading", { name: "Contracts & agent", exact: true }).count(), 1);
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await visit("/");
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Guide", exact: true }).click();
    await page.waitForURL(origin + "/guide");
    await check("mobile website navigation works", async () => assert.equal(await page.getByRole("heading", { name: "AgentCaps setup guide.", exact: true }).count(), 1));
    await visit("/app");
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Payments", exact: true }).click();
    await page.waitForURL(origin + "/app/receipts");
    await check("mobile app navigation closes after selection", async () => assert.equal(await page.locator(".sidebar").evaluate(element => element.classList.contains("open")), false));
    await visit("/");
    await page.getByText("Does the spending cap include gas?", { exact: true }).click();
    await check("FAQ disclosure opens", async () => assert.match(await page.locator("details[open]").textContent(), /ETH/));
    const config = await (await page.request.get(origin + "/api/config")).json();
    await check("runtime configuration is public Base Sepolia only", async () => {
      assert.equal(config.chainId, 84532);
      assert.equal(config.usdc.toLowerCase(), "0x036cbd53842c5426634e7929541ec2318f3dcf7e");
      assert.equal("localOwner" in config, false);
      assert.equal("localDemo" in config, false);
    });
    await check("old unsigned demo action is unavailable", async () => assert.equal((await page.request.post(origin + "/api/demo", { data: { action: "create" } })).status(), 404));
    await check("unsigned payment requests are rejected", async () => {
      const response = await page.request.post(origin + "/api/agent/pay", { data: { taskId: "1", recipient: "0x3333333333333333333333333333333333333333", amount: "1", requestId: "9c16d8ba-cd0e-42c7-b7d5-3c86a3ae4321", expiresAt: Math.floor(Date.now() / 1000) + 120 } });
      assert.equal(response.status(), 400);
    });
    await check("invalid payment JSON returns a request error", async () => {
      const response = await page.request.post(origin + "/api/agent/pay", { headers: { "Content-Type": "application/json" }, data: "{" });
      assert.equal(response.status(), 400);
    });
    await check("no uncaught browser or hydration errors", async () => {
      assert.equal(errors.length, 0, errors[0]);
      assert.equal(hydrationErrors.length, 0, hydrationErrors[0]);
    });
    results.passed = true;
  }
} catch (error) {
  results.passed = false;
  results.error = String(error);
  await screenshot("page-review-failure");
  throw error;
} finally {
  fs.writeFileSync("verification/" + (capture ? "product-capture" : captureHero ? "hero-capture" : "page-review") + ".json", JSON.stringify(results, null, 2));
  await browser.close();
}
