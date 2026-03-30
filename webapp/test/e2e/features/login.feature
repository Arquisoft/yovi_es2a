Feature: Login
  Scenario: A player decides to login with his account and is SUCCESSFULL
    Given The database is prepared for 'SUCCESS'
    And The page is in the login menu
    When The player register with user name 'Alice' and password '123' 
    Then I should be redirected to the main menu

Scenario: A player decides to login with his account and is DONT_EXISTS
    Given The database is prepared for 'DONT_EXISTS'
    And The page is in the login menu
    When The player register with user name 'Alice' and password '123' 
    Then I receive an error message: 'User not found'

Scenario: A player decides to login with his account and is PASSWORD_DOESNT_MATCH
    Given The database is prepared for 'PASSWORD_DOESNT_MATCH'
    And The page is in the login menu
    When The player register with user name 'Alice' and password '123' 
    Then I receive an error message: 'Invalid password'
