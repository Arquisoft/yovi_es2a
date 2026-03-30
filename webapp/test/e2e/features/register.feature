Feature: Register

  # Caso Exitoso
  Scenario: Successfull register
    Given The server is prepared for a "SUCCESS" registration
    And The user is on the registration tab
    When The user fills the form with username "Alice" and password "123"
    Then The account should be created successfully

  # Caso de Error (Usuario ya existe)
  Scenario: Duplicated user in register
    Given The server is prepared for a "DUPLICATE" registration
    And The user is on the registration tab
    When The user fills the form with username "Alice" and password "123"
    Then I should see an error message "The username 'Alice' is already taken. Please choose another one."