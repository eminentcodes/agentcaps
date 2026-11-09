import fs from "node:fs";
import { chromium } from "@playwright/test";

const readable = source => source
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ").trim();

if (process.argv.includes("--alternatives")) {
  const urls = [
    "https://docs.base.org/base-chain/tools/network-faucets",
    "https://ethfaucet.com/networks/base-sepolia",
    "https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
    "https://console.optimism.io/faucet",
    "https://faucet.learnweb3.io/",
    "https://sepolia-faucet.pk910.de/",
    "https://docs.arc.network/llms.txt",
  ];
  const results = await Promise.all(urls.map(async url => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      const source = await response.text();
      const name = new URL(url).hostname.replaceAll(".", "-");
      fs.writeFileSync(`verification/funding-alternative-${name}.txt`, source);
      const result = { url, finalUrl: response.url, status: response.status, text: (url.endsWith(".txt") ? source : readable(source)).slice(0, 16000) };
      console.log(JSON.stringify(result));
      return result;
    } catch (error) {
      const result = { url, error: String(error), cause: String(error.cause ?? "") };
      console.log(JSON.stringify(result));
      return result;
    }
  }));
  fs.writeFileSync("verification/funding-alternatives.json", JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
} else if (process.argv.includes("--inspect-alternatives")) {
  const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
  const browser = await chromium.launch({ headless: true, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const urls = [
    "https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
    "https://console.optimism.io/faucet",
    "https://sepolia-faucet.pk910.de/",
    "https://faucet.circle.com/",
  ];
  const results = await Promise.all(urls.map(async url => {
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25_000 }).catch(error => console.log(JSON.stringify({ url, navigation: String(error) })));
      await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
      const result = {
        url, finalUrl: page.url(),
        text: (await page.locator("body").innerText({ timeout: 5_000 })).slice(0, 9000),
        inputs: await page.locator("input").evaluateAll(elements => elements.map(element => ({ type: element.type, placeholder: element.placeholder, name: element.name }))),
        buttons: await page.getByRole("button").allTextContents(),
        links: await page.locator("a[href]").evaluateAll(elements => elements.map(element => ({ text: element.textContent, href: element.href })).filter(link => /faucet|bridge|claim|ETH|USDC|wallet|login|sign|faq|help/i.test(link.text)).slice(0, 30)),
      };
      console.log(JSON.stringify(result));
      return result;
    } catch (error) {
      const result = { url, finalUrl: page.url(), error: String(error) };
      console.log(JSON.stringify(result));
      return result;
    } finally { await page.close(); }
  }));
  fs.writeFileSync("verification/funding-alternative-browser.json", JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
  await browser.close();
} else if (process.argv.includes("--cached")) {
  for (const name of ["ethfaucet.html", "thirdweb-faucet.html", "chainlink-faucet.html", "base-faucet.html"]) {
    console.log(JSON.stringify({ name, text: readable(fs.readFileSync(`verification/${name}`, "utf8")).slice(0, 7000) }));
  }
  for (const name of ["thirdweb-ui.js", "chainstack-ui.js"]) {
    const source = fs.readFileSync(`verification/${name}`, "utf8");
    const snippets = [...source.matchAll(/faucet|mainnet|captcha|requestFunds/g)].map(match => source.slice(Math.max(0, match.index - 140), match.index + 350));
    console.log(JSON.stringify({ name, snippets: [...new Set(snippets)].slice(0, 25) }));
  }
} else if (process.argv.includes("--credentials")) {
  const names = ["CDP_API_KEY_ID", "CDP_API_KEY_SECRET", "CDP_WALLET_SECRET", "CHAINSTACK_API_KEY", "CIRCLE_API_KEY", "CIRCLE_ENTITY_SECRET", "CIRCLE_WALLET_API_KEY", "CIRCLE_WALLET_ENTITY_SECRET"];
  const contents = [".env.local", ".env.testnet.local"].filter(file => fs.existsSync(file)).map(file => fs.readFileSync(file, "utf8"));
  console.log(JSON.stringify(Object.fromEntries(names.map(name => [name, Boolean(process.env[name]) || contents.some(source => new RegExp(`^${name}=.+$`, "m").test(source))]))));
} else if (process.argv.includes("--browser") || process.argv.includes("--claim-steps") || process.argv.includes("--base-direct")) {
  const directBase = process.argv.includes("--base-direct");
  const inspectSteps = process.argv.includes("--claim-steps") || directBase;
  const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
  const browser = await chromium.launch({ headless: true, ...(fs.existsSync(edge) ? { executablePath: edge } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const urls = directBase ? ["https://ethfaucet.com/networks/base-sepolia"] : inspectSteps ? [
    "https://ethfaucet.com/networks/base",
    "https://faucets.chain.link/base-sepolia",
  ] : [
    "https://ethfaucet.com/networks/base",
    "https://thirdweb.com/base-sepolia-testnet",
    "https://portal.cdp.coinbase.com/onchain-tools/faucet",
    "https://faucet.quicknode.com/base/sepolia",
  ];
  const results = await Promise.all(urls.map(async url => {
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 }).catch(error => console.log(JSON.stringify({ url, navigation: String(error) })));
      await page.waitForLoadState("load", { timeout: 8_000 }).catch(() => {});
      if (inspectSteps && url.includes("ethfaucet")) {
        if (!directBase) {
          await page.getByRole("button", { name: "Claim Base Sepolia ETH", exact: true }).click({ timeout: 10_000, noWaitAfter: true });
          await page.waitForLoadState("domcontentloaded", { timeout: 10_000 }).catch(() => {});
        }
        const { deployer } = JSON.parse(fs.readFileSync("deployments/testnet-wallets.json", "utf8"));
        await page.getByPlaceholder(/Enter wallet address/).fill(deployer, { timeout: 10_000 });
        await page.waitForFunction(() => !/Enter a valid wallet address|Checking|Loading/i.test(document.body.innerText), null, { timeout: 12_000 }).catch(() => {});
        const claim = page.getByRole("button", { name: "Claim", exact: true });
        if (await claim.isEnabled()) {
          await claim.click({ timeout: 10_000 });
          await page.waitForFunction(() => /success|sent|claimed|verify|verification|score|error|failed/i.test(document.body.innerText), null, { timeout: 12_000 }).catch(() => {});
        }
        await page.screenshot({ path: "verification/eth-faucet-claim.png" });
      }
      if (inspectSteps && url.includes("faucets.chain.link")) {
        await page.getByRole("button", { name: /Base Sepolia[\s\S]*0\.5 ETH/ }).click({ timeout: 10_000 });
        await page.waitForFunction(() => !document.body.innerText.includes("Loading..."), null, { timeout: 8_000 }).catch(() => {});
        await page.getByRole("button", { name: "Continue", exact: true }).click({ timeout: 10_000 });
        await page.getByRole("dialog").first().waitFor({ timeout: 8_000 }).catch(() => {});
        await page.screenshot({ path: "verification/chainlink-faucet-claim.png" });
      }
      const result = { url, finalUrl: page.url(), text: (await page.locator("body").innerText({ timeout: 8_000 })).slice(0, 9000), inputs: await page.locator("input").evaluateAll(elements => elements.map(element => ({ type: element.type, placeholder: element.placeholder, name: element.name }))), buttons: await page.getByRole("button").allTextContents(), links: inspectSteps ? await page.locator("a[href]").evaluateAll(elements => elements.map(element => ({ text: element.textContent, href: element.href })).filter(link => /faucet|claim|ETH|wallet|login|sign/i.test(link.text)).slice(0, 20)) : undefined };
      console.log(JSON.stringify(result));
      return result;
    } catch (error) { const result = { url, finalUrl: page.url(), error: String(error) }; console.log(JSON.stringify(result)); return result; }
    finally { await page.close(); }
  }));
  fs.writeFileSync(`verification/${directBase ? "faucet-base-direct" : inspectSteps ? "faucet-claim-steps" : "faucet-audit"}.json`, JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
  await browser.close();
} else {
  const urls = [
    "https://docs.cdp.coinbase.com/faucets/introduction/quickstart.md",
    "https://ethfaucet.com/networks/base",
    "https://faucet.quicknode.com/base/sepolia",
  ];
  await Promise.all(urls.map(async url => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      const source = await response.text();
      console.log(JSON.stringify({ url, status: response.status, text: (url.endsWith(".md") ? source : readable(source)).slice(0, 9000) }));
    } catch (error) { console.log(JSON.stringify({ url, error: String(error) })); }
  }));
}
