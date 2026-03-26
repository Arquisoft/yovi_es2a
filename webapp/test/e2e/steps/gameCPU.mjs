import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'

// Al ser una clase más extensa que el resto guardamos las constantes fuera de las funciones por legibilidad
const BASE_URL = 'http://localhost:5173';
const SELECTORS = {
    cellEmpty: '.table-cell.empty',
    cellAny: '.table-cell',
    surrenderBtn: '.game-surrender-button', 
    gameBoard: '.game-board',
    turnText: '.game-info p',
    vsMaquinaBtn: '.mode-btn:has-text("vs Máquina")',
    botBtn: '.bot-btn',
    playBtn: '.play-btn.ready'
};

Given('The server is prepared for a successful game session', async function () {
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

Given('I am logged in and on the play menu', async function () {
    const page = this.page;
    await page.goto(BASE_URL);
    
    // Mock rápido de login para el bypass
    await page.route('**/login', async (route) => {
        await route.fulfill({
            status: 200,
            body: JSON.stringify({ user: { username: "Alice" } })
        });
    });

    await page.fill('#username', 'Alice');
    await page.fill('#password', '123');
    await page.press('#password', 'Enter');
    
    await page.waitForURL('**/menu');
    // Navegamos al lobby desde el menú
    await page.click('button:has-text("Jugar")');
    await page.waitForSelector(SELECTORS.vsMaquinaBtn);
});

Given('I have an active game against {string}', async function (opponent) {
    const page = this.page;
    await page.click(SELECTORS.vsMaquinaBtn);
    await page.click(`.bot-btn:has-text("${opponent}")`);
    await page.click(SELECTORS.playBtn);
    await page.waitForSelector(SELECTORS.gameBoard, { state: 'visible', timeout: 10000 });
});

When('I configure the board and start a game vs {string}', async function (opponent) {
    await this.page.click('button:has-text("vs Máquina")');
    await this.page.click(`.bot-btn:has-text("${opponent}")`);
    await this.page.click(SELECTORS.playBtn);
    await this.page.waitForSelector(SELECTORS.gameBoard, { state: 'visible', timeout: 10000 });

});

When('I click on the surrender button', async function () {
    await this.page.click(SELECTORS.surrenderBtn);
});

When('I click on an empty cell', async function () {
    const cell = this.page.locator(SELECTORS.cellEmpty).first();
    await cell.click();
});

// --- THEN / VALIDACIONES ---

Then('I should see the game board', async function () {
    const isVisible = await this.page.locator(SELECTORS.gameBoard).isVisible();
    assert.strictEqual(isVisible, true, "El tablero no apareció");
});

Then('The cell should be marked as mine', async function () {
    await this.page.waitForSelector('.table-cell.player_one', { timeout: 10000 });
    const exists = await this.page.locator('.table-cell.player_one').count();
    assert.ok(exists > 0, "La casilla sigue vacía tras el click");
});

Then('The Bot should make its move automatically', async function () {
    // Verificamos que el texto del turno indica que el proceso siguió adelante
    const text = await this.page.locator(SELECTORS.turnText).innerText();
    assert.ok(text.includes('PLAYER_ONE'), "El bot no devolvió el turno");
});

Then('I should see the game over screen', async function () {
    await this.page.waitForSelector('.overlay-content', { state: 'visible', timeout: 10000 });
    const isVisible = await this.page.locator('.overlay-content').isVisible();
    assert.strictEqual(isVisible, true, "No apareció la pantalla de fin de partida");
});

Then('It should be my turn again', async function () {
    const text = await this.page.locator(SELECTORS.turnText).innerText();
    assert.strictEqual(text, 'Turno: PLAYER_ONE');
});