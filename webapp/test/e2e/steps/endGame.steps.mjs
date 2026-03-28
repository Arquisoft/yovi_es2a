import { When } from '@cucumber/cucumber'

When('I click on the return to menu button', async function () {
    await this.page.click('.overlay-button:not(.reset-button)');
});

When('I click on the play again button', async function () {
    await this.page.click('.overlay-button.reset-button');
    await this.page.waitForSelector('.game-board', { state: 'visible', timeout: 5000 });
});