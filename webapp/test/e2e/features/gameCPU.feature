Feature: Gameplay vs Bot

  Background:
    Given The server is prepared for a successful CPU game session
    And I am logged in and on the play menu

  Scenario Outline: Starting a game against the CPU
    When I configure the board and start a game vs "<difficulty>" "<strategy>"
    Then I should see the game board

    Examples:
      | strategy              | difficulty  |
      | Aleatorio             | NO          |
      | Defensivo             | MEDIUM      |
      | Ofensivo              | HARD        |
      | Posicional            | EASY        |

  Scenario Outline: Surrendering a game
    Given I have an active game against "<difficulty>" "<strategy>"
    When I click on the surrender button
    Then I should see the game over screen

    Examples:
      | strategy              | difficulty  |
      | Aleatorio             | NO          |
      | Defensivo             | MEDIUM      |
      | Ofensivo              | HARD        |
      | Posicional            | EASY        |

  Scenario Outline: Player and Bot take turns
    Given I have an active game against "<difficulty>" "<strategy>"
    When I click on an empty cell
    Then The cell should be marked as mine
    And The Bot should make its move automatically
    And It should be my turn again

    Examples:
      | strategy              | difficulty  |
      | Aleatorio             | NO          |
      | Defensivo             | MEDIUM      |
      | Ofensivo              | HARD        |
      | Posicional            | EASY        |