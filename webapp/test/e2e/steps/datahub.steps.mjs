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
    // Seleccionamos el filtro
    await this.page.selectOption('.filter-select', '1');
    
    // Esperamos simplemente a que el DOM se actualice tras el cambio de filtro
    await this.page.waitForTimeout(1000);
});

Then('I should see the history table', async function () {
    await this.page.waitForSelector('.historic-list', { state: 'visible', timeout: 5000 });
    const isVisible = await this.page.locator('.historic-list').isVisible();
    assert.strictEqual(isVisible, true, 'No se muestra el historial');
});

Then('The history table should only show victories', async function () {
    // Esperamos a que haya algún elemento visible en el historial
    await this.page.waitForSelector('.game-card', { state: 'visible', timeout: 5000 });

    const cards = await this.page.locator('.game-card').all();
    assert.ok(cards.length > 0, 'La lista de victorias está vacía');

    for (const card of cards) {
        const text = await card.textContent();
        assert.ok(/Victoria|victoria|WIN|win|1/i.test(text), `Error: tarjeta inesperada: ${text}`);
    }
});

Then('I should see the statistics cards', async function () {
    const isVisible = await this.page.locator('.stats-cards').isVisible()
    assert.strictEqual(isVisible, true, 'No se muestran las tarjetas de estadísticas')
})
