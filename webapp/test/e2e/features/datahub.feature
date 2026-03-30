Feature: History and statistics

  Background:
    Given The server is prepared for datahub
    And I am logged in

  Scenario: Player accesses their match history
    When I navigate to my data
    Then I should see the history table

  Scenario: Player switches to statistics tab
    When I navigate to my data
    And I click on the statistics tab
    Then I should see the statistics cards

  Scenario: Player filters history by result
    When I navigate to my data
    And I filter history by victory
    Then The history table should only show victories