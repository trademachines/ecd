Feature: Validate configs
  As a user
  I want to validate configurations
  So that I can have a fast feedback loop

  Scenario: Successfully validate minimal configuration
    Given I have the config
    """
    my-service {
      containerDefinitions [
        {
          name: "foobar"
        }
      ]
    }
    """
    When I run validate on my-service@cluster

  Scenario: Try to validate service not present in configuration
    Given I have the config
    """
    some-service = {
      containerDefinitions = [
        {
          name = ${SERVICE}
        }
      ]
    }
    """
    When I run validate on other-service@cluster
    Then the response should not be ok
    And the response property error.message equals Validating configuration file failed
    And the response property error.details.errors[0] equals Can not find key other-service in configuration.
