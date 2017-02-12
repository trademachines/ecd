'use strict';

const FileFinder = require('./../../../src/lambda/core/finder').FileFinder;
const File       = require('./../../../src/lambda/core/finder').File;
const mock       = require('mock-fs');

describe('Finding files', () => {
  let s3SyncedPath;
  let s3Sync;
  let finder;

  beforeEach(() => {
    s3Sync       = {
      sync: () => {
        return Promise.resolve(s3SyncedPath);
      }
    };
    s3SyncedPath = '/data';
    finder       = new FileFinder(s3Sync);
  });
  afterEach(mock.restore);

  describe('finding variable files', () => {
    const find = (expectedPath, mockConfig, done) => {
      mock(mockConfig);

      finder.find('my-cluster', 'my-service').then(
        (files) => {
          expect(files.length).toEqual(2);
          expect(files[0]).toEqual(new File('variable', `/data/${expectedPath}/bar.properties`));
          expect(files[1]).toEqual(new File('variable', `/data/${expectedPath}/foo.var`));

          done();
        },
        done.fail
      );
    };

    it('finds all files in global variables dir', (done) => {
      find('globals/var', {
        '/data': {
          'some-file.txt': 'file content here',
          'globals': {
            'var': {'foo.var': '', 'bar.properties': ''}
          }
        }
      }, done);
    });

    it('finds all files in cluster variables dir', (done) => {
      find('clusters/my-cluster/var', {
        '/data': {
          'some-file.txt': 'file content here',
          'clusters': {
            'my-cluster': {
              'var': {'foo.var': '', 'bar.properties': ''}
            }
          }
        }
      }, done);
    });

    it('finds all files in service variables dir', (done) => {
      find('services/my-service/var', {
        '/data': {
          'some-file.txt': 'file content here',
          'services': {
            'my-service': {
              'var': {'foo.var': '', 'bar.properties': ''}
            }
          }
        }
      }, done);
    });

    it('finds all files in service+cluster variables dir', (done) => {
      find('services/my-service/clusters/my-cluster/var', {
        '/data': {
          'some-file.txt': 'file content here',
          'services': {
            'my-service': {
              'clusters': {
                'my-cluster': {
                  'var': {'foo.var': '', 'bar.properties': ''}
                }
              }
            }
          }
        }
      }, done);
    });
  });

  describe('finding config files', () => {
    const find = (expectedPath, mockConfig, done) => {
      mock(mockConfig);

      finder.find('my-cluster', 'my-service').then(
        (files) => {
          expect(files.length).toEqual(2);
          expect(files[0]).toEqual(new File('config', `/data/${expectedPath}/one.conf`));
          expect(files[1]).toEqual(new File('config', `/data/${expectedPath}/two.conf`));

          done();
        },
        done.fail
      );
    };

    it('finds config files in global config dir', (done) => {
      find('globals', {
        '/data': {
          'globals': {
            'one.conf': '',
            'two.conf': '',
            'not.found': ''
          }
        }
      }, done);
    });

    it('finds config files in cluster config dir', (done) => {
      find('clusters/my-cluster', {
        '/data': {
          'clusters': {
            'my-cluster': {
              'one.conf': '',
              'two.conf': '',
              'not.found': ''
            }
          }
        }
      }, done);
    });

    it('finds all files in service variables dir', (done) => {
      find('services/my-service', {
        '/data': {
          'services': {
            'my-service': {
              'one.conf': '',
              'two.conf': '',
              'not.found': ''
            }
          }
        }
      }, done);
    });

    it('finds all files in service+cluster variables dir', (done) => {
      find('services/my-service/clusters/my-cluster', {
        '/data': {
          'services': {
            'my-service': {
              'clusters': {
                'my-cluster': {
                  'one.conf': '',
                  'two.conf': '',
                  'not.found': ''
                }
              }
            }
          }
        }
      }, done);
    });
  });

  it('puts variables first', (done) => {
    mock({
      '/data': {
        'globals': {
          'var': {
            'global.var': ''
          },
          'global.conf': ''
        },
        'clusters': {
          'my-cluster': {
            'var': {
              'my-cluster.var': ''
            },
            'my-cluster.conf': ''
          }
        },
        'services': {
          'my-service': {
            'var': {
              'my-service.var': ''
            },
            'my-service.conf': '',
            'clusters': {
              'my-cluster': {
                'var': {
                  'my-service-cluster.var': ''
                },
                'my-service-cluster.conf': ''
              }
            }
          }
        }
      }
    });

    finder.find('my-cluster', 'my-service').then(
      (files) => {
        expect(files.length).toEqual(8);
        expect(files).toEqual([
          new File('variable', `/data/globals/var/global.var`),
          new File('variable', `/data/clusters/my-cluster/var/my-cluster.var`),
          new File('variable', `/data/services/my-service/var/my-service.var`),
          new File('variable', `/data/services/my-service/clusters/my-cluster/var/my-service-cluster.var`),
          new File('config', `/data/globals/global.conf`),
          new File('config', `/data/clusters/my-cluster/my-cluster.conf`),
          new File('config', `/data/services/my-service/my-service.conf`),
          new File('config', `/data/services/my-service/clusters/my-cluster/my-service-cluster.conf`)
        ]);

        done();
      },
      done.fail
    );
  });
});
