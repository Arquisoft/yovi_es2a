import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

const mockHistory = [
    { _id: '1', username: 'Alice', rival: 'random_bot', resultado: '1', size: 7, createdAt: '2026-03-26T10:00:00Z' },
    { _id: '2', username: 'Alice', rival: 'invitado',   resultado: '2', size: 7, createdAt: '2026-03-25T10:00:00Z' },
    { _id: '3', username: 'Alice', rival: 'invitado',   resultado: '1', size: 5, createdAt: '2026-03-24T10:00:00Z' },
];

const mockStats = {
    username: 'Alice',
    total: 3,
    wins: 2,
    losses: 1,
    winRate: 66.7,
    currentStreak: 1,
    bestStreak: 2,
    mostPlayedRival: 'invitado',
    rivalStats: {
        random_bot: { wins: 1, losses: 0, total: 1 },
        invitado:   { wins: 1, losses: 1, total: 2 },
    }
};

Given('The server is prepared for datahub', async function () {
    const page = this.page;

    await page.route('**/history/Alice**', async (route) => {
        const url = route.request().url();
        const params = new URL(url).searchParams;
        const resultado = params.get('resultado');

        const filtered = resultado
            ? mockHistory.filter(r => r.resultado === resultado)
            : mockHistory;

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ history: filtered })
        });
    });

    await page.route('**/stats/Alice', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(mockStats)
        });
    });
});

Given('I am logged in', async function () {
    const page = this.page;
    await page.goto('http://localhost:5173');
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
});

When('I navigate to my data', async function () {
    await this.page.click('button:has-text("Ver datos")');
    await this.page.waitForSelector('.datahub-container', { state: 'visible', timeout: 5000 });
});

When('I click on the statistics tab', async function () {
    await this.page.click('.datahub-tab:has-text("Estadísticas")');
    await this.page.waitForSelector('.stats-container', { state: 'visible', timeout: 5000 });
});

When('I filter history by victory', async function () {
    await this.page.selectOption('.historic-filter-select', '1');
    await this.page.click('.historic-filter-btn');
    await this.page.waitForTimeout(1000);
});

Then('I should see the history table', async function () {
    const isVisible = await this.page.locator('.historic-table').isVisible();
    assert.strictEqual(isVisible, true, "No se muestra la tabla del historial");
});

Then('I should see the statistics cards', async function () {
    const isVisible = await this.page.locator('.stats-cards').isVisible();
    assert.strictEqual(isVisible, true, "No se muestran las tarjetas de estadísticas");
});

Then('The history table should only show victories', async function () {
    const rows = await this.page.locator('.historic-table tbody tr').all();
    for (const row of rows) {
        const text = await row.innerText();
        assert.ok(text.includes('Victoria'), `Fila no es victoria: ${text}`);
    }
});