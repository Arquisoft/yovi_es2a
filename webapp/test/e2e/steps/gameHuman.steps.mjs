import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'
import { TEST_USER, TEST_PASS, API_URL, BASE_URL } from '../support/setup.mjs'
import { expect } from '@playwright/test'

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
    await page.waitForSelector('.game-board', { state: 'visible', timeout: 30000 });
    await page.waitForSelector('.table-cell.empty', { state: 'visible', timeout: 30000 });
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
    
    // Esperamos a que el texto del turno contenga "PLAYER_TWO" o el nombre del rival
    // En lugar de un assert directo, usamos waitForFunction o un regex flexible
    await page.waitForFunction((selector) => {
        const element = document.querySelector(selector);
        return element && (element.textContent.includes('PLAYER_TWO') || element.textContent.includes('Turno:'));
    }, '.game-turn', { timeout: 5000 });

    const text = await turnLocator.innerText();
    // Aceptamos PLAYER_TWO o el nombre que uses para el segundo jugador
    assert.ok(text.includes('PLAYER_TWO') || text.includes('Invitado'), `Turno inesperado: ${text}`);
});
