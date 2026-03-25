import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

Given('the user is on the registration tab', async function () {
  const page = this.page;

  // --- CONFIGURACIÓN DEL MOCK ---
  // Interceptamos la llamada POST a /createuser que hace el Frontend
  await page.route('**/createuser', async (route) => {
    // Simulamos que el backend responde con éxito (201 Created)
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        message: "Hello Alice!",
        user: { username: "Alice" }
      })
    });
  });

  // Forzamos el login
  await page.route('**/menu', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: "Welcome", user: { username: "Alice" } })
    });
  });

  await page.goto('http://localhost:80');
  
  // Localizamos el botón de REGISTER por su texto para ser más precisos
  await page.click('button.auth-tab:has-text("REGISTER")');
  
  // Verificamos que tiene la clase 'selected' para confirmar que cambió la pestaña
  const isSelected = await page.locator('button.auth-tab.selected:has-text("REGISTER")').isVisible();
  assert.strictEqual(isSelected, true, 'La pestaña Register debería estar seleccionada');
});

When('the user fills the form with username {string} and password {string}', async function (user, pass) {
  const page = this.page;
  // Rellenamos el formulario de registro
  await page.fill('#username', user);
  await page.fill('#password', pass);
  await page.fill('#confirmPassword', pass);
  
  // Click en el botón de envío del formulario
  await page.press('#confirmPassword', 'Enter');
});

Then('the account should be created successfully', async function () {
  const page = this.page;
  // Esperamos que tras el registro nos lleve al menú principal
  await page.waitForURL('**/menu', { timeout: 5000 });
  console.error('URL actual después del registro:', page.url());
  assert.ok(page.url().includes('/menu'), 'Debería redirigir al menú principal después de un registro exitoso');
});