'use strict';

const FileFinder = require('./../../../src/lambda/core/finder').FileFinder;
const File       = require('./../../../src/lambda/core/finder').File;

describe('Finding files', () => {
  let s3SyncedPath;
  let s3Sync;
  let finder;

  beforeEach(() => {
    s3Sync = {
      sync: () => {
        return Promise.resolve(s3SyncedPath);
      }
    };
    finder = new FileFinder(s3Sync);
  });

  describe('finding variable files', () => {
    const basePath = __dirname + '/_fixtures/finder/for-variables';
    const find     = (fixtureDir, expectedPath, done) => {
      s3SyncedPath = `${basePath}/${fixtureDir}`;
      finder.find('my-cluster', 'my-service').then(
        (files) => {
          expect(files.length).toEqual(2);
          expect(files[0]).toEqual(new File('variable', `${s3SyncedPath}/${expectedPath}/bar.properties`));
          expect(files[1]).toEqual(new File('variable', `${s3SyncedPath}/${expectedPath}/foo.var`));

          done();
        },
        done.fail
      );
    };

    it('finds all files in global variables dir', (done) => {
      find('global-vars-only', 'globals/var', done);
    });

    it('finds all files in cluster variables dir', (done) => {
      find('cluster-vars-only', 'clusters/my-cluster/var', done);
    });

    it('finds all files in service variables dir', (done) => {
      find('service-vars-only', 'services/my-service/var', done);
    });

    it('finds all files in service+cluster variables dir', (done) => {
      find('service-and-cluster-vars', 'services/my-service/clusters/my-cluster/var', done);
    });
  });

  describe('finding config files', () => {
    const basePath = __dirname + '/_fixtures/finder/for-configs';
    const find     = (fixtureDir, expectedPath, done) => {
      s3SyncedPath = `${basePath}/${fixtureDir}`;
      finder.find('my-cluster', 'my-service').then(
        (files) => {
          expect(files.length).toEqual(2);
          expect(files[0]).toEqual(new File('config', `${s3SyncedPath}/${expectedPath}/one.conf`));
          expect(files[1]).toEqual(new File('config', `${s3SyncedPath}/${expectedPath}/two.conf`));

          done();
        },
        done.fail
      );
    };

    it('finds config files in global config dir', (done) => {
      find('global-configs-only', 'globals', done);
    });

    it('finds config files in cluster config dir', (done) => {
      find('cluster-configs-only', 'clusters/my-cluster', done);
    });

    it('finds all files in service variables dir', (done) => {
      find('service-configs-only', 'services/my-service', done);
    });

    it('finds all files in service+cluster variables dir', (done) => {
      find('service-and-cluster-configs', 'services/my-service/clusters/my-cluster', done);
    });
  });

  it('puts variables first', (done) => {
    s3SyncedPath   = __dirname + '/_fixtures/finder/variables-first';

    finder.find('my-cluster', 'my-service').then(
      (files) => {
        expect(files.length).toEqual(8);
        expect(files).toEqual([
          new File('variable', `${s3SyncedPath}/globals/var/global.var`),
          new File('variable', `${s3SyncedPath}/clusters/my-cluster/var/my-cluster.var`),
          new File('variable', `${s3SyncedPath}/services/my-service/var/my-service.var`),
          new File('variable', `${s3SyncedPath}/services/my-service/clusters/my-cluster/var/my-service-cluster.var`),
          new File('config', `${s3SyncedPath}/globals/global.conf`),
          new File('config', `${s3SyncedPath}/clusters/my-cluster/my-cluster.conf`),
          new File('config', `${s3SyncedPath}/services/my-service/my-service.conf`),
          new File('config', `${s3SyncedPath}/services/my-service/clusters/my-cluster/my-service-cluster.conf`)
        ]);

        done();
      },
      done.fail
    );
  });
});
