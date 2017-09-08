Feature: Deploy a service
  As a user
  I want to deploy a service
  So that others can benefit from changes

  Scenario: Successfully deploy a config
    Given I have the config
    """
    my-service {
      containerDefinitions [
        {
          name: "foobar"
          environment {
            foo = ${FOO}
          }
        }
      ]
    }
    """
    And I have a variable FOO with value bar
    And there is a service
    """
    {
      "serviceName": "my-service",
      "taskDefinition": "my-service:1"
    }
    """
    When I run deploy on my-service@cluster
    Then the response should be ok
    And a task definition should be registered with
    """
    {
      "containerDefinitions": [
        {
          "name": "foobar",
          "environment": [
            {
              "name": "foo",
              "value": "bar"
            }
          ]
        }
      ],
      "family": "my-service"
    }
    """
    And the service my-service@cluster should be updated
