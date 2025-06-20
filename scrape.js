const puppeteer = require("puppeteer");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  const allResults = [];

  for (let pageNum = 1; pageNum <= 2; pageNum++) {
    const url = `https://www.bbb.org/us/tx/dallas/category/plumber?page=${pageNum}`;
    await page.goto(url, { waitUntil: "networkidle2" });

    await page.waitForSelector("h3.bds-h4.result-business-name");

    const results = await page.evaluate(() => {
      const nameEls = Array.from(
        document.querySelectorAll("h3.bds-h4.result-business-name")
      );

      return nameEls.map((nameEl) => {
        const name = nameEl.innerText.trim();
        const card = nameEl.closest("div.card");

        let phone = "";
        let address = "";

        if (card) {
          const stack = card.querySelector("div.stack");
          if (stack) {
            const phoneEl = stack.querySelector("a.text-black[href^='tel:']");
            phone = phoneEl?.innerText.trim() || "";

            // Find the next <p.bds-body> after the <a>
            if (phoneEl) {
              let next = phoneEl.nextElementSibling;
              while (next) {
                if (
                  next.tagName === "P" &&
                  next.classList.contains("bds-body")
                ) {
                  address = next.innerText.trim();
                  break;
                }
                next = next.nextElementSibling;
              }
            }
          }
        }

        return { name, phone, address };
      });
    });

    allResults.push(...results);
    console.log(`✅ Page ${pageNum} scraped: ${results.length} listings`);
  }

  await browser.close();

  fs.writeFileSync(
    "bbb_businesses_full.json",
    JSON.stringify(allResults, null, 2)
  );
  console.log("✅ Name, phone, and address saved to bbb_businesses_full.json");
})();
