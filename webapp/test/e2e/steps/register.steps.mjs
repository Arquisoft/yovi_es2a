import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

Given('The server is prepared for a {string} registration', async function (type) {
  const page = this.page;

  // --- CONFIGURACIÓN DEL MOCK ---
  // Interceptamos la llamada POST a /createuser que hace el Frontend
  await page.route('**/createuser', async (route) => {
    if (type === "SUCCESS") {
      await route.fulfill({
        status: 201, // Created
        contentType: 'application/json',
        body: JSON.stringify({ message: "Hello Alice!", user: { username: "Alice" } })
      });
    } else if (type === "DUPLICATE") {
      await route.fulfill({
        status: 409, // Conflict
        contentType: 'application/json',
        body: JSON.stringify({ error: "The username 'Alice' is already taken. Please choose another one." })
      });
    }
  });

  await page.route('**/menu', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: "Welcome", user: { username: "Alice" } })
        });
    });
});

Given('The user is on the registration tab', async function () {
  const page = this.page;
  await page.goto('http://localhost:5173');

  // Localizamos el botón de REGISTER
  await page.click('button.auth-tab:has-text("REGISTER")');
  
  // Verificamos que tiene la clase 'selected' para confirmar que cambió la pestaña
  const isSelected = await page.locator('button.auth-tab.selected:has-text("REGISTER")').isVisible();
  assert.strictEqual(isSelected, true, 'La pestaña Register debería estar seleccionada');
});

When('The user fills the form with username {string} and password {string}', async function (user, pass) {
  const page = this.page;
  // Rellenamos el formulario de registro
  await page.fill('#username', user);
  await page.fill('#password', pass);
  await page.fill('#confirmPassword', pass);
  
  // Click en el botón de envío del formulario
  await page.press('#confirmPassword', 'Enter');
});

Then('The account should be created successfully', async function () {
  const page = this.page;
  // Esperamos que tras el registro nos lleve al menú principal
  await page.waitForURL('**/menu', { timeout: 5000 });
  console.error('URL actual después del registro:', page.url());
  assert.ok(page.url().includes('/menu'), 'Debería redirigir al menú principal después de un registro exitoso');
});

Then('I should see an error message {string}', async function (expectedError) {
  const locator = this.page.locator('.error-message'); 
  await locator.waitFor({ state: 'visible' });
  const actualText = await locator.innerText();
  assert.ok(actualText.includes(expectedError), `Se esperaba "${expectedError}" pero se leyó "${actualText}"`);
});