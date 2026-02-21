const {By, Builder, Browser} = require('selenium-webdriver');

(async function firstTest() {
  let driver;
  
  try {
    driver = await new Builder().forBrowser(Browser.CHROME).build();
    await driver.get('https://canvas.cmu.edu');
    let title = await driver.getTitle();
    console.log(title);
    await driver.manage().setTimeouts({implicit: 500});
    let html = await driver.getPageSource();
    // let textBox = await driver.findElement(By.tagName('h3'));
    // let text = await textBox.getAttribute("");
    // console.log(html);
    } catch (e) {
      console.log(e);
    } finally {
  }
}())
