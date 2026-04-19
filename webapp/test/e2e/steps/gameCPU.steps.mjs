import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'
import { TEST_USER, TEST_PASS, API_URL } from '../support/setup.mjs'

const SELECTORS = {
    cellEmpty: '.table-cell.empty',
    gameBoard: '.game-board',
    turnText:  '.game-info p',
    playBtn:   '.play-btn.ready'
}

Given('The server is prepared for a successful CPU game session', async function () {

    const res = await fetch(`${API_URL}/createuser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: TEST_USER, password: TEST_PASS })
    })
    assert.ok(res.ok, 'No se pudo preparar el usuario de test para gameCPU')
    })

    When('I configure the board and start a game vs {string} {string}', async function (difficulty, opponent) {
    const page = this.page
    await page.click('button:has-text("vs Máquina")')
    await page.click(`.bot-btn:has-text("${opponent}")`)
    if (difficulty !== 'NO') {
        await page.click(`.diff-btn.diff-${difficulty.toLowerCase()}`)
    }
    await page.click(SELECTORS.playBtn)
    await page.waitForSelector(SELECTORS.gameBoard, { state: 'visible', timeout: 5000 })
})

When('I click on an empty cell', async function () {
    const cell = this.page.locator(SELECTORS.cellEmpty).first()
    await cell.click()
})

Then('The cell should be marked as mine', async function () {
    await this.page.waitForSelector('.table-cell.player_one', { timeout: 5000 })
    const count = await this.page.locator('.table-cell.player_one').count()
    assert.ok(count > 0, 'La casilla sigue vacía tras el click')
})

Then('The Bot should make its move automatically', async function () {
    // Esperamos a que el bot haga su movimiento y nos devuelva el turno
    await this.page.waitForFunction(() => {
        const p = document.querySelector('.game-info p')
        return p && p.textContent.includes('PLAYER_ONE')
    }, { timeout: 10000 })
    const text = await this.page.locator(SELECTORS.turnText).innerText()
    assert.ok(text.includes('PLAYER_ONE'), 'El bot no devolvió el turno')
})

Then('It should be my turn again', async function () {
    const text = await this.page.locator(SELECTORS.turnText).innerText()
    assert.ok(text.includes('PLAYER_ONE'), 'No es el turno del jugador')
})
