import { Given, When, Then } from '@cucumber/cucumber'
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

Given('I have an active game against {string} {string}', async function (difficulty, opponent) {
    const page = this.page;
    await page.click('.mode-btn:has-text("vs Máquina")');
    await page.click(`.bot-btn:has-text("${opponent}")`);
    if(difficulty!=='NO') {
        await page.click(`.diff-btn.diff-${difficulty.toLowerCase()}`);
    }
    await page.click('.play-btn.ready');
    await page.waitForSelector('.game-board', { state: 'visible', timeout: 5000 });
});

When('I click on the surrender button', async function () {
    await this.page.click('.game-surrender-button');
});


Then('I should see the game board', async function () {
    const isVisible = await this.page.locator('.game-board').isVisible();
    assert.strictEqual(isVisible, true, "El tablero no apareció");
});

Then('I should see the game over screen', async function () {
    await this.page.waitForSelector('.overlay-content', { state: 'visible', timeout: 5000 });
    const isVisible = await this.page.locator('.overlay-content').isVisible();
    assert.strictEqual(isVisible, true, "No apareció la pantalla de fin de partida");
});

Then('I should be redirected to the main menu', async function () {
    const page = this.page;
    // Esperamos que tras el registro nos lleve al menú principal
    await page.waitForURL('**/menu', { timeout: 5000 });
    console.error('URL actual después del registro:', page.url());
    assert.ok(page.url().includes('/menu'), 'Debería redirigir al menú principal después de un registro exitoso');
});