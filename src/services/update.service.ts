import { BitbucketAPI } from '../api/bitbucket/index.js';
import { NpmApi } from '../api/npm/index.js';
import type { UpdateOptions } from '../commands/update/index.js';

export class UpdateService {
  #npmApi;
  #bitbucketApi;

  constructor(bitbucketApi: BitbucketAPI, npmApi: NpmApi) {
    this.#bitbucketApi = bitbucketApi;
    this.#npmApi = npmApi;
  }

  async update({ packageName, packageVersion }: UpdateOptions) {
    const repository = await this.#bitbucketApi.getRepository();
    console.log(`Found repository: ${repository.full_name}`);

    const mainBranch = repository.mainbranch.name;
    console.log(`Main branch: ${mainBranch}`);

    const packageJson = await this.#bitbucketApi.getFile(
      mainBranch,
      'package.json',
    );

    const npmPackage = await this.#npmApi.getPackageInfo(packageName);

    if (!(packageVersion in npmPackage.time)) {
      throw new Error(`Version ${packageVersion} not found`);
    }

    if (
      !(
        packageName in packageJson.dependencies &&
        packageName in packageJson.devDependencies
      )
    ) {
      throw new Error(
        `Package ${packageName} not found in dependencies or devDependencies`,
      );
    }

    if (packageName in packageJson.dependencies) {
      console.log(`Updating ${packageName} in dependencies...`);
      packageJson.dependencies[packageName] = packageVersion;
    }

    if (packageName in packageJson.devDependencies) {
      console.log(`Updating ${packageName} in devDependencies...`);
      packageJson.devDependencies[packageName] = packageVersion;
    }

    console.log(`Updating package.json...`);

    const branch = `deps/${packageName}-${packageVersion}`;
    console.log(`Checking out to new branch ${branch}...`);

    await this.#bitbucketApi.createBranch(branch, mainBranch);

    console.log(`Creating commit...`);

    const newPackageJson = JSON.stringify(packageJson, null, 2);

    await this.#bitbucketApi.editFile(branch, 'package.json', newPackageJson);

    console.log(`Commit created`);

    console.log(`Creating pull request...`);

    const pr = await this.#bitbucketApi.createPullRequest(
      branch,
      mainBranch,
      `Update ${packageName} to ${packageVersion}`,
    );

    console.log(`PR created ${pr.links.html.href}`);
  }
}
