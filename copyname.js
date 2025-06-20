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

        // Traverse to the nearest shared parent — probably .card.result-card
        const card = nameEl.closest("div.card");

        let phone = "";
        if (card) {
          const phoneEl = card.querySelector(
            "div.stack a.text-black[href^='tel:']"
          );
          phone = phoneEl?.innerText.trim() || "";
        }

        return { name, phone };
      });
    });

    allResults.push(...results);
    console.log(`✅ Page ${pageNum} scraped: ${results.length} listings`);
  }

  await browser.close();

  fs.writeFileSync(
    "bbb_businesses_name_phone.json",
    JSON.stringify(allResults, null, 2)
  );
  console.log("✅ Name and phone saved to bbb_businesses_name_phone.json");
})();
