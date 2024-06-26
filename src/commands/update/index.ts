import type { Argv } from 'yargs';

import { BitbucketAPI } from '../../api/bitbucket/index.js';
import { NpmApi } from '../../api/npm/index.js';
import { UpdateService } from '../../services/update.service.js';

export type UpdateOptions = {
  projectKey: string;
  repositorySlug: string;
  packageName: string;
  packageVersion: string;
  username: string;
  password: string;
};

const updateCommand = {
  name: 'update',
  command: `update`,
  describe: 'Using this command you can make a commit with updated libraries',
  builder: (yargs: Argv) => {
    return yargs
      .option('project-key', {
        describe: 'Project key',
        demandOption: true,
        type: 'string',
      })
      .option('repository-slug', {
        describe: 'Repository slug',
        demandOption: true,
        type: 'string',
      })
      .option('package-name', {
        describe: 'Package name',
        type: 'string',
        demandOption: true,
      })
      .option('package-version', {
        describe: 'Package version',
        type: 'string',
        demandOption: true,
      })
      .option('username', {
        describe: 'Username',
        type: 'string',
      })
      .option('password', {
        describe: 'Password',
        type: 'string',
      });
  },
  handler: async (argv: UpdateOptions) => {
    const bitbucketApi = new BitbucketAPI(
      {
        username: argv.username,
        password: argv.password,
      },
      argv.projectKey,
      argv.repositorySlug,
    );
    const npmApi = new NpmApi();

    const options = {
      projectKey: argv.projectKey,
      repositorySlug: argv.repositorySlug,
      username: argv.username,
      password: argv.password,
      packageName: argv.packageName,
      packageVersion: argv.packageVersion,
    };

    // TODO: Use dependency injection to get UpdateService
    const service = new UpdateService(bitbucketApi, npmApi);
    await service.update(options);
  },
};

export default updateCommand;
