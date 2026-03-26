import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

Given('The database is prepared for {string}', async function (type) {
    const page = this.page;

    // --- CONFIGURACIÓN DEL MOCK ---
    // Interceptamos la llamada POST a /createuser que hace el Frontend
    await page.route('**/login', async (route) => {
        if (type === "SUCCESS") {
            await route.fulfill({
                status: 200, // OK
                contentType: 'application/json',
                body: JSON.stringify({ message: "Hello Alice!", user: { username: "Alice" } })
            });
        } else if (type === "DONT_EXISTS") {
            await route.fulfill({
                status: 401, // Unauthorized
                contentType: 'application/json',
                body: JSON.stringify({ error: "User not found" })
            });
        } else if (type === "PASSWORD_DOESNT_MATCH") {
            await route.fulfill({
                status: 401, // Unauthorized
                contentType: 'application/json',
                body: JSON.stringify({ error: "Invalid password" })
            });
        }
    });

    await page.route('**/menu', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: "Menu data" })
        });
    });
});

Given('The page is in the login menu', async function () {
    const page = this.page;
    await page.goto('http://localhost:5173');

    // Localizamos el botón de LOGIN
    await page.click('button.auth-tab:has-text("LOGIN")');
    
    // Verificamos que tiene la clase 'selected' para confirmar que cambió la pestaña
    const isSelected = await page.locator('button.auth-tab.selected:has-text("LOGIN")').isVisible();
    assert.strictEqual(isSelected, true, 'La pestaña Login debería estar seleccionada');
});

When('The player register with user name {string} and password {string}', async function (user, pass) {
    const page = this.page;
    // Rellenamos el formulario de registro
    await page.fill('#username', user);
    await page.fill('#password', pass);

    // Hacemos click en el botón de envío del formulario
    await page.press('#password', 'Enter');
});

Then('I should be redirected to the main menu', async function () {
    const page = this.page;
    // Esperamos que tras el registro nos lleve al menú principal
    await page.waitForURL('**/menu', { timeout: 5000 });
    console.error('URL actual después del registro:', page.url());
    assert.ok(page.url().includes('/menu'), 'Debería redirigir al menú principal después de un registro exitoso');
});

Then('I receive an error message: {string}', async function (expectedError) {
    const locator = this.page.locator('.error-message'); 
    await locator.waitFor({ state: 'visible' });
    const actualText = await locator.innerText();
    assert.ok(actualText.includes(expectedError), `Se esperaba "${expectedError}" pero se leyó "${actualText}"`);
});
