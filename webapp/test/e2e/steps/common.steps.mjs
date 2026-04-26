import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'
import { TEST_USER, TEST_PASS, BASE_URL } from '../support/setup.mjs'

// Paso compartido: login con el usuario de test y navegar al menú de juego
Given('I am logged in and on the play menu', async function () {
    const page = this.page
    await page.goto(BASE_URL)

    await page.fill('#username', TEST_USER)
    await page.fill('#password', TEST_PASS)
    await page.press('#password', 'Enter')

    await page.waitForURL('**/menu')
    await page.click('button:has-text("Jugar")')
    await page.waitForSelector('.mode-btn:has-text("vs Máquina")')
})

// Añadimos una espera explícita a que aparezcan las celdas
Given('I have an active game against {string} {string}', async function (difficulty, opponent) {
    const page = this.page
    await page.click('.mode-btn:has-text("vs Máquina")')
    await page.click(`.bot-btn:has-text("${opponent}")`)
    if (difficulty !== 'NO') {
        await page.click(`.diff-btn.diff-${difficulty.toLowerCase()}`)
    }
    await page.click('.play-btn.ready')
    
    // Esperamos al contenedor y TAMBIÉN a que se dibujen las celdas
    await page.waitForSelector('.game-board', { state: 'visible', timeout: 15000 })
    await page.waitForSelector('.table-cell.empty', { state: 'visible', timeout: 30000 })
})

// Le enseñamos a Playwright a aceptar el pop-up de confirmación
When('I click on the surrender button', async function () {
    const page = this.page;
    
    // IMPORTANTE: Le decimos al bot que cuando salga un 'window.confirm', le dé a Aceptar
    page.once('dialog', dialog => dialog.accept());
    
    await page.click('.btn-surrender');
});

Then('I should see the game board', async function () {
    const isVisible = await this.page.locator('.game-board').isVisible()
    assert.strictEqual(isVisible, true, 'El tablero no apareció')
})

Then('I should see the game over screen', async function () {
    await this.page.waitForSelector('.overlay-content', { state: 'visible', timeout: 5000 })
    const isVisible = await this.page.locator('.overlay-content').isVisible()
    assert.strictEqual(isVisible, true, 'No apareció la pantalla de fin de partida')
})

Then('I should be redirected to the main menu', async function () {
    const page = this.page
    await page.waitForURL('**/menu', { timeout: 5000 })
    assert.ok(page.url().includes('/menu'), 'Debería redirigir al menú principal')
})
