import puppeteer from 'puppeteer';
import { createServer } from 'vite';

(async () => {
  const server = await createServer({
    server: { port: 3000 },
    root: process.cwd(),
  });
  await server.listen();

  console.log("Vite server started");

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('pageerror', err => {
    console.error('PAGE ERROR:', err.message);
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('PAGE CONSOLE ERROR:', msg.text());
    }
  });

  await page.goto('http://localhost:3000');

  await page.waitForSelector('input');
  
  // Find the variable inputs
  // The first input is funcName, the next ones are variables.
  const inputs = await page.$$('input');
  
  // Variable inputs are index 1, 2, 3, 4 (if numVars is 4)
  // Let's set them to I, OL, C, and empty
  
  // Clear and type
  await inputs[1].click({ clickCount: 3 });
  await inputs[1].press('Backspace');
  await inputs[1].type('I');

  await inputs[2].click({ clickCount: 3 });
  await inputs[2].press('Backspace');
  await inputs[2].type('OL');

  await inputs[3].click({ clickCount: 3 });
  await inputs[3].press('Backspace');
  await inputs[3].type('C');

  await inputs[4].click({ clickCount: 3 });
  await inputs[4].press('Backspace');
  
  // Wait a bit to see if it crashes
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Test finished");
  
  await browser.close();
  await server.close();
  process.exit(0);
})();
