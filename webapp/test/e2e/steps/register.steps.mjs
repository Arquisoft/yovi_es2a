import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'
import { TEST_USER, TEST_PASS, API_URL } from '../support/setup.mjs'

/**
 * Prepara la BD para los escenarios de registro:
 *
 *  SUCCESS   → el usuario de test no debe existir para poder registrarlo
 *  DUPLICATE → el usuario de test ya existe, así el registro fallará con "already taken"
 */
Given('The server is prepared for a {string} registration', async function (type) {

  // Creamos previamente el usuario para que falle el test
  if (type === 'DUPLICATE') {
    const res = await fetch(`${API_URL}/createuser`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: TEST_USER, password: TEST_PASS })
    })
    assert.ok(res.ok, 'No se pudo crear el usuario duplicado de test')
  }
})

Given('The user is on the registration tab', async function () {
  const page = this.page
  await page.goto('http://localhost:5173')

  await page.click('button.auth-tab:has-text("REGISTER")')

  const isSelected = await page.locator('button.auth-tab.selected:has-text("REGISTER")').isVisible()
  assert.strictEqual(isSelected, true, 'La pestaña Register debería estar seleccionada')
})

When('The user fills the form with username {string} and password {string}', async function (_user, _pass) {
  const page = this.page

  await page.fill('#username', TEST_USER)
  await page.fill('#password', TEST_PASS)
  await page.fill('#confirmPassword', TEST_PASS)
  await page.press('#confirmPassword', 'Enter')
})

Then('The account should be created successfully', async function () {
  const page = this.page
  await page.waitForURL('**/menu', { timeout: 5000 })
  assert.ok(page.url().includes('/menu'), 'Debería redirigir al menú principal tras el registro')
})

Then('I should see an error message {string}', async function (expectedError) {
  const locator = this.page.locator('.error-message')
  await locator.waitFor({ state: 'visible' })
  const actualText = await locator.innerText()
  assert.ok(
    actualText.includes('is already taken'),
    `Se esperaba mensaje de duplicado pero se leyó "${actualText}"`
  )
})
