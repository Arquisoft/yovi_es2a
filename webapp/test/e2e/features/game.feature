Feature: Game Flow
  Scenario: The player decides to surrender in a game vs bot
    Given Estoy registrado y en el menú de juego
    When I configure the board and start a game vs {string}
    And I click on the surrender button
    Then I should be redirected to the main menu