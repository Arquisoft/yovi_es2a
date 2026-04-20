import { setWorldConstructor, Before, After, BeforeAll, setDefaultTimeout } from '@cucumber/cucumber'
import { chromium } from 'playwright'

setDefaultTimeout(60_000)

export const BASE_URL = 'http://localhost:5173'
export const API_URL = 'http://localhost:3000'

// Usuario de test dedicado
export const TEST_USER = '__test__user__'
export const TEST_PASS = '__test__pass__99!'

class CustomWorld {
  browser = null
  page = null
}

setWorldConstructor(CustomWorld)

Before(async function () {
    // Limpia el usuario de test antes de que empiece cualquier paso
    // Lo eliminamos antes para asegurarnos que no está creado
  await fetch(`${API_URL}/testing/deleteuser/${TEST_USER}`, {
    method: 'DELETE'
  })
  
  const headless = true
  const slowMo = 0
  const devtools = false

  this.browser = await chromium.launch({ headless, slowMo, devtools })
  this.page = await this.browser.newPage()
})

After(async function () {
  if (this.page) await this.page.close()
  if (this.browser) await this.browser.close()
})
