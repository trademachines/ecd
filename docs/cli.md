# Command line interface
To ease the interaction with the Lambda function running on AWS there is a small command line interface
in the form of a [docker image](https://hub.docker.com/r/trademachines/ecd).

# Usage
For running the CLI you should add some convenience on top of docker, e.g. with an alias:
 
    alias ecd='docker pull trademachines/ecd > /dev/null && docker run --rm -v ~/.aws:/root/.aws -v $(pwd):/usr/share/ecd trademachines/ecd'

If you have done that, just run ``ecd --help`` and follow the instructions.
