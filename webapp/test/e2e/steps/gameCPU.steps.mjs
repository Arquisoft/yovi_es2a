import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

// Probando cómo hacer tests decidí sacar variables fuera de los métodos para no repetir códido
// pensado que iba a ser más largo el archivo.
const SELECTORS = {
    cellEmpty: '.table-cell.empty',
    gameBoard: '.game-board',
    turnText: '.game-info p',
    playBtn: '.play-btn.ready'
};

Given('The server is prepared for a successful CPU game session', async function () {
    const page = this.page;

    // Coordenadas para crear el tablero
    const mockCells = [
    { index: 0, player: null, coords: [2, 0, 0] },
    { index: 1, player: null, coords: [1, 0, 1] },
    { index: 2, player: null, coords: [1, 1, 0] },
    { index: 3, player: null, coords: [0, 0, 2] },
    { index: 4, player: null, coords: [0, 1, 1] },
    { index: 5, player: null, coords: [0, 2, 0] },
    ];

    // Interceptamos la creación de partida
    await page.route('**/game/new', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                game_id: "game-123",
                status: "ongoing",
                next_player: 0,
                winner: null,
                cells: mockCells
            })
        });
    });

    // Interceptamos el movimiento/rendición
    // Recordemos que rendirse es como mover pero pasandole el parámetro winner
    await page.route('**/game/game-123/move', async (route) => {
        const body = route.request().postDataJSON();
        if (body?.action === 'resign') {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    game_state: {
                        game_id: "game-123",
                        status: "finished",
                        next_player: null,
                        winner: 1,
                        cells: mockCells
                    }
                })
            });
        } else {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    game_state: {
                        game_id: "game-123",
                        status: "ongoing",
                        next_player: 0,
                        winner: null,
                        cells: mockCells.map((c, i) => i === 0 ? { ...c, player: 0 } : c)
                    }
                })
            });
        }
    });
});

When('I configure the board and start a game vs {string} {string}', async function (difficulty, opponent) {
    await this.page.click('button:has-text("vs Máquina")');
    await this.page.click(`.bot-btn:has-text("${opponent}")`);
    if(difficulty!=='NO') {
        await this.page.click(`.diff-btn.diff-${difficulty.toLowerCase()}`);
    }
    await this.page.click(SELECTORS.playBtn);
    await this.page.waitForSelector(SELECTORS.gameBoard, { state: 'visible', timeout: 5000 });

});

When('I click on an empty cell', async function () {
    const cell = this.page.locator(SELECTORS.cellEmpty).first();
    await cell.click();
});

Then('The cell should be marked as mine', async function () {
    await this.page.waitForSelector('.table-cell.player_one', { timeout: 5000 });
    const exists = await this.page.locator('.table-cell.player_one').count();
    assert.ok(exists > 0, "La casilla sigue vacía tras el click");
});

Then('The Bot should make its move automatically', async function () {
    // Verificamos que el texto del turno indica que el proceso siguió adelante
    const text = await this.page.locator(SELECTORS.turnText).innerText();
    assert.ok(text.includes('PLAYER_ONE'), "El bot no devolvió el turno");
});


Then('It should be my turn again', async function () {
    const text = await this.page.locator(SELECTORS.turnText).innerText();
    assert.strictEqual(text, 'Turno: PLAYER_ONE');
});