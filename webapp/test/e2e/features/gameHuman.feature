Feature: Gameplay vs Human

  Background:
    Given The server is prepared for a human game session
    And I am logged in and on the play menu

  Scenario: Starting a game against another player
    When I configure the board for a human game
    Then I should see the game board

  Scenario: Players alternate turns
    Given I have an active human game
    When Player one clicks on an empty cell
    Then The cell should be marked as player one
    And It should be player two turn