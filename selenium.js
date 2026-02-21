const {By, Builder, Browser} = require('selenium-webdriver');

(async function firstTest() {
  let driver;
  
  try {
    driver = await new Builder().forBrowser(Browser.CHROME).build();
    await driver.get('https://canvas.cmu.edu');
    let title = await driver.getTitle();
    console.log(title);
    username = "Test";
    password = "Test";

    await driver.manage().setTimeouts({implicit: 500});


    let usernameInput = await driver.wait(
      until.elementLocated(By.id(username)),
      10000
    ); 
    await usernameInput.sendKeys(usernameInput);
    
    let passwordInput = await driver.wait(
      until.elementLocated(By.id(password)),
      10000
    ); 
    await passwordInput.sendKeys(passwordInput);
    await passwordInput.sendKeys("\n");


    // let html = await driver.getPageSource();
    // let textBox = await driver.findElement(By.tagName('h3'));
    // let text = await textBox.getAttribute("");
    // console.log(html);
    } catch (e) {
      console.log(e);
    } finally {
  }
}())
