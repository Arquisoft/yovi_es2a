Feature: Gameplay vs Bot
  Background:
    Given the server is prepared for a successful game session
    And I am logged in and on the play menu

  Scenario: Starting a game against the CPU
    When I configure the board and start a game vs "CPU"
    Then I should see the game board

  Scenario: Surrendering a game
    Given I have an active game against "CPU"
    When I click on the surrender button
    Then I should be redirected to the main menu