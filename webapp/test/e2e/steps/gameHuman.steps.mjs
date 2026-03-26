import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

const BASE_URL = 'http://localhost:5173';
const SELECTORS = {
    cellEmpty: '.table-cell.empty',
    gameBoard: '.game-board',
    turnText: '.game-info p',
    vsHumanoBtn: '.mode-btn:has-text("vs Humano")',
    playBtn: '.play-btn.ready',
    overlay: '.overlay-content'
};

const mockCells = [
    { index: 0, player: null, coords: [2, 0, 0] },
    { index: 1, player: null, coords: [1, 0, 1] },
    { index: 2, player: null, coords: [1, 1, 0] },
    { index: 3, player: null, coords: [0, 0, 2] },
    { index: 4, player: null, coords: [0, 1, 1] },
    { index: 5, player: null, coords: [0, 2, 0] },
];

Given('The server is prepared for a human game session', async function () {
    const page = this.page;

    await page.route('**/game/new', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                game_id: "game-456",
                status: "ongoing",
                next_player: 0,
                winner: null,
                cells: mockCells
            })
        });
    });

    await page.route('**/game/game-456/move', async (route) => {
        const body = route.request().postDataJSON();
        const isWinningMove = body?.cell_index === 5;

        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                game_state: {
                    game_id: "game-456",
                    status: isWinningMove ? "finished" : "ongoing",
                    next_player: isWinningMove ? null : (body?.player === 0 ? 1 : 0),
                    winner: isWinningMove ? 0 : null,
                    cells: mockCells.map((c, i) =>
                        i === body?.cell_index ? { ...c, player: body?.player } : c
                    )
                }
            })
        });
    });
});

Given('I have an active human game', async function () {
    const page = this.page;
    await page.click(SELECTORS.vsHumanoBtn);
    await page.click(SELECTORS.playBtn);
    await page.waitForSelector(SELECTORS.gameBoard, { state: 'visible', timeout: 5000 });
});

When('I configure the board for a human game', async function () {
    await this.page.click('.mode-btn:has-text("vs Humano")');
    await this.page.click('.play-btn.ready');
    await this.page.waitForSelector('.game-board', { state: 'visible', timeout: 5000 });
});

When('Player one clicks on an empty cell', async function () {
    await this.page.locator(SELECTORS.cellEmpty).first().click();
});

When('Player one makes the winning move', async function () {
    // Clicamos la celda de índice 5 que el mock interpreta como movimiento ganador
    await this.page.locator(SELECTORS.cellEmpty).last().click();
});

Then('The cell should be marked as player one', async function () {
    await this.page.waitForSelector('.table-cell.player_one', { timeout: 5000 });
    const count = await this.page.locator('.table-cell.player_one').count();
    assert.ok(count > 0, "No hay celdas marcadas como jugador uno");
});

Then('It should be player two turn', async function () {
    await this.page.waitForFunction(() => {
        const p = document.querySelector('.game-info p');
        return p && p.textContent.includes('PLAYER_TWO');
    }, { timeout: 5000 });
    const text = await this.page.locator(SELECTORS.turnText).innerText();
    assert.ok(text.includes('PLAYER_TWO'), "No es el turno del jugador dos");
});