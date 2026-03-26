Feature: Gameplay vs Bot

  Background:
    Given The server is prepared for a successful game session
    And I am logged in and on the play menu

  Scenario: Starting a game against the CPU
    When I configure the board and start a game vs "Defensivo"
    Then I should see the game board

  Scenario: Surrendering a game
    Given I have an active game against "Defensivo"
    When I click on the surrender button
    Then I should see the game over screen

  Scenario: Player and Bot take turns
    Given I have an active game against "Defensivo"
    When I click on an empty cell
    Then The cell should be marked as mine
    And The Bot should make its move automatically
    And It should be my turn again