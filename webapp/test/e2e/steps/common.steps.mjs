import { Given, Then } from '@cucumber/cucumber'
import assert from 'assert'

const BASE_URL = 'http://localhost:5173';

Given('I am logged in and on the play menu', async function () {
    const page = this.page;
    await page.goto(BASE_URL);

    await page.route('**/login', async (route) => {
        await route.fulfill({
            status: 200,
            body: JSON.stringify({ user: { username: "Alice" } })
        });
    });

    await page.fill('#username', 'Alice');
    await page.fill('#password', '123');
    await page.press('#password', 'Enter');

    await page.waitForURL('**/menu');
    await page.click('button:has-text("Jugar")');
    await page.waitForSelector('.mode-btn:has-text("vs Máquina")');
});

Then('I should see the game board', async function () {
    const isVisible = await this.page.locator('.game-board').isVisible();
    assert.strictEqual(isVisible, true, "El tablero no apareció");
});

Then('I should see the game over screen', async function () {
    await this.page.waitForSelector('.overlay-content', { state: 'visible', timeout: 10000 });
    const isVisible = await this.page.locator('.overlay-content').isVisible();
    assert.strictEqual(isVisible, true, "No apareció la pantalla de fin de partida");
});