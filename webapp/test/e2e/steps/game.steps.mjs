import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

// Reutilizamos lógica de navegación
Given('I am logged in and on the play menu', async function () {
    const page = this.page;

    await page.route('**/login', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: "Welcome", user: { username: "Alice" } })
        });
    });

    await this.page.goto('http://localhost:80');
    await this.page.fill('#username', 'Alice');
    await this.page.fill('#password', '123');
    await this.page.click('.submit-button');
    await this.page.click('.menu-option-btn.play');
})

When('I configure the board and start a game vs {string}', async function (opponent) {
    // btn vs bot
    await this.page.click('.mode-btn:has-text("vs Máquina")'); 

    // Tipo de bot
    const botBtn = this.page.locator('.bot-btn', { hasText: opponent });
    await botBtn.click();

    // A jugar
    await this.page.click('.button.play-btn.ready');
})

When('I click on the surrender button', async function () {
  // Esperamos que el botón de rendirse aparezca en la pantalla de juego
    await this.page.click('.btn-surrender');
})

Then('', async function () {
    await this.page.waitForURL('**/menu');
    const url = this.page.url();
    assert.ok(url.includes('/menu'), `Expected to be redirected to /menu, but got ${url}`);
})