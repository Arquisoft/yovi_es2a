import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

// Reutilizamos lógica de navegación
Given('I am logged in and on the play menu', async function () {
    await this.page.goto('http://localhost:80');

    await this.page.click('#play-option')
})

When('I configure the board and start a game vs {string}', async function (opponent) {
    // Elegir oponente (basado en el string "CPU" del feature)
    await this.page.click(`.mode-${opponent.toLowerCase()}`) 
    await this.page.click('#start-game')
})

When('I click on the surrender button', async function () {
  // Esperamos que el botón de rendirse aparezca en la pantalla de juego
    await this.page.click('.btn-surrender')
})

Then('I should be redirected to the main menu', async function () {
    await this.page.waitForURL('**/lobby')
    const url = this.page.url()
    assert.ok(url.includes('/lobby'))
})