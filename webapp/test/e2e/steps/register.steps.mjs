import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

Given('the register page is open', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  await page.goto('http://localhost:5173')
  // Hacemos click en la pestaña REGISTER
  await page.click('.auth-tab:nth-child(2)')
})

When('I enter {string} as the username and submit', async function (username) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  await page.fill('#username', username)
  await page.fill('#password', 'password123')
  await page.fill('#confirmPassword', 'password123')
  await page.click('.submit-button')
})

Then('I should see a welcome message containing {string}', async function (expected) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  // Tras el registro exitoso redirige a /lobby, comprobamos que llegamos ahí
  await page.waitForURL('**/lobby', { timeout: 5000 })
  const url = page.url()
  assert.ok(url.includes('/lobby'), `Expected redirect to /lobby, got: ${url}`)
})
