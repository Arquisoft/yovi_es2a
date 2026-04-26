import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'
import { TEST_USER, TEST_PASS, API_URL, BASE_URL } from '../support/setup.mjs'

const SELECTORS = {
    cellEmpty:   '.table-cell.empty',
    gameBoard:   '.game-board',
    turnText:    '.game-turn',
    vsHumanoBtn: '.mode-btn:has-text("vs Humano")',
    playBtn:     '.play-btn.ready',
    overlay:     '.overlay-content'
}

/**
 * Asegura que el usuario de test existe antes de los tests de partida humano vs humano.
 */
Given('The server is prepared for a human game session', async function () {
    const res = await fetch(`${API_URL}/createuser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: TEST_USER, password: TEST_PASS })
    })
    assert.ok(res.ok, 'No se pudo preparar el usuario de test para gameHuman')
})

Given('I have an active human game', async function () {
    const page = this.page;
    await page.click('.mode-btn:has-text("vs Humano")');
    await page.click('.play-btn.ready');
    
    // Esperamos a las celdas
    await page.waitForSelector('.game-board', { state: 'visible', timeout: 5000 });
    await page.waitForSelector('.table-cell.empty', { state: 'visible', timeout: 10000 });
});

When('I configure the board for a human game', async function () {
    const page = this.page
    await page.click('.mode-btn:has-text("vs Humano")')
    await page.click('.play-btn.ready')
    
    // Esperamos a las celdas
    await page.waitForSelector('.game-board', { state: 'visible', timeout: 5000 })
    await page.waitForSelector('.table-cell.empty', { state: 'visible', timeout: 10000 })
})

When('Player one clicks on an empty cell', async function () {
    await this.page.locator(SELECTORS.cellEmpty).first().click()
})

Then('The cell should be marked as player one', async function () {
    await this.page.waitForSelector('.table-cell.player_one', { timeout: 5000 })
    const count = await this.page.locator('.table-cell.player_one').count()
    assert.ok(count > 0, 'No hay celdas marcadas como jugador uno')
})

Then('It should be player two turn', async function () {
    const page = this.page;
    const turnLocator = page.locator('.game-turn');
    
    const overlay = page.locator('.overlay-content');
    if (!(await overlay.isVisible())) {
        const text = await turnLocator.innerText();
        assert.ok(text.includes('PLAYER_TWO'), `Se esperaba el turno de PLAYER_TWO pero es: ${text}`);
    }
});
