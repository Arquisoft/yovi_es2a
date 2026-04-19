import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'
import { TEST_USER, TEST_PASS, API_URL, BASE_URL } from '../support/setup.mjs'

Given('The server is prepared for datahub', async function () {
    const reg = await fetch(`${API_URL}/createuser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: TEST_USER, password: TEST_PASS })
    })
    assert.ok(reg.ok, 'No se pudo registrar el usuario de test para datahub')

    // Guardamos 3 partidas directamente via /savegame
    //    resultado '1' = victoria, '2' = derrota
    await fetch(`${API_URL}/savegame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: TEST_USER, rival: 'random_bot', resultado: '1', size: 7 })
    })
    await fetch(`${API_URL}/savegame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: TEST_USER, rival: 'invitado', resultado: '2', size: 7 })
    })
    await fetch(`${API_URL}/savegame`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: TEST_USER, rival: 'invitado', resultado: '1', size: 5 })
    })
})

Given('I am logged in', async function () {
    const page = this.page
    await page.goto(BASE_URL)
    await page.fill('#username', TEST_USER)
    await page.fill('#password', TEST_PASS)
    await page.press('#password', 'Enter')
    await page.waitForURL('**/menu')
})

When('I navigate to my data', async function () {
    await this.page.click('button:has-text("Ver datos")')
    await this.page.waitForSelector('.datahub-container', { state: 'visible', timeout: 5000 })
})

When('I click on the statistics tab', async function () {
    await this.page.click('.datahub-tab:has-text("Estadísticas")')
    await this.page.waitForSelector('.stats-container', { state: 'visible', timeout: 5000 })
})

When('I filter history by victory', async function () {
    await this.page.selectOption('.filter-select', '1')
    // Esperamos a que no quede ninguna derrota visible
    await this.page.waitForFunction(() => 
        document.querySelectorAll('.game-card--loss').length === 0
    , { timeout: 5000 })
})

Then('I should see the history table', async function () {
    // Esperamos a que aparezca la tabla
    await this.page.waitForSelector('.historic-list', { state: 'visible', timeout: 5000 })
    const isVisible = await this.page.locator('.historic-list').isVisible()
    assert.strictEqual(isVisible, true, 'No se muestra el historial')
})

Then('I should see the statistics cards', async function () {
    const isVisible = await this.page.locator('.stats-cards').isVisible()
    assert.strictEqual(isVisible, true, 'No se muestran las tarjetas de estadísticas')
})

Then('The history table should only show victories', async function () {
    await this.page.waitForSelector('.game-card--win', { state: 'visible', timeout: 5000 });

    const cards = await this.page.locator('.game-card').all();
    
    assert.ok(cards.length > 0, 'No hay partidas en el historial después de filtrar');

    for (const card of cards) {
        const text = await card.textContent();
        assert.ok(text.includes('Victoria'), `Se encontró una tarjeta que no es victoria. Contenido: ${text}`);
    }
});