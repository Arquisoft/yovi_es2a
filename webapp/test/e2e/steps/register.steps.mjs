import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

Given('the user is on the registration tab', async function () {
  const page = this.page;
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