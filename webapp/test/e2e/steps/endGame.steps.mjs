import { Given, When } from '@cucumber/cucumber'
import assert from 'assert'
import { TEST_USER, TEST_PASS, API_URL } from '../support/setup.mjs'


Given('The server is prepared for a successful game session', async function () {

    const res = await fetch(`${API_URL}/createuser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: TEST_USER, password: TEST_PASS })
    })
    assert.ok(res.ok, 'No se pudo preparar el usuario de test para endGame')
})

When('I click on the return to menu button', async function () {
    await this.page.click('.overlay-button:not(.reset-button)')
})

When('I click on the play again button', async function () {
    await this.page.click('.overlay-button.reset-button')
    await this.page.waitForSelector('.game-board', { state: 'visible', timeout: 5000 })
})
