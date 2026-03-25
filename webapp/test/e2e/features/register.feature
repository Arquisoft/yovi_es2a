Feature: Register
  Validate the users register

  Scenario: Eegistro exitoso
    Given the user is on the registration tab
    When the user fills the form with username 'Alice' and password '123'
    Then the account should be created successfully