import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'
import { TEST_USER, TEST_PASS, API_URL } from '../support/setup.mjs'

Given('The database is prepared for {string}', async function (type) {
    this._loginType = type

    // Crea el usuario, lo hacemos así para simplificar pasos, simplemente una llamada a la API
    // De todas formas el regiter ya se prueba en register
    if (type === 'SUCCESS' || type === 'PASSWORD_DOESNT_MATCH') {
        const res = await fetch(`http://localhost:3000/createuser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: TEST_USER, password: TEST_PASS })
        })
        assert.ok(res.ok, `No se pudo crear el usuario de test para el escenario "${type}"`)
    }
})

Given('The page is in the login menu', async function () {
    const page = this.page
    await page.goto('http://localhost:5173')
    await page.click('button.auth-tab:has-text("LOGIN")')
    const isSelected = await page.locator('button.auth-tab.selected:has-text("LOGIN")').isVisible()
    assert.strictEqual(isSelected, true, 'La pestaña Login debería estar seleccionada')
})

When('The player register with user name {string} and password {string}', async function (_user, _pass) {
    const page = this.page
    const password = this._loginType === 'PASSWORD_DOESNT_MATCH'
        ? '__wrong__pass__'
        : TEST_PASS

    await page.fill('#username', TEST_USER)
    await page.fill('#password', password)
    await page.press('#password', 'Enter')
})

Then('I receive an error message: {string}', async function (expectedError) {
    const locator = this.page.locator('.error-message')
    await locator.waitFor({ state: 'visible' })
    const actualText = await locator.innerText()
    assert.ok(
        actualText.includes(expectedError),
        `Se esperaba "${expectedError}" pero se leyó "${actualText}"`
    )
})