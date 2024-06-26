import { BitbucketAPI } from '../api/bitbucket/index.js';
import { NpmApi } from '../api/npm/index.js';
import type { UpdateOptions } from '../commands/update/index.js';

export class UpdateService {
  constructor(
    private readonly bitbucketApi: BitbucketAPI,
    private readonly npmApi: NpmApi,
  ) {}

  async update({ packageName, packageVersion }: UpdateOptions) {
    const repository = await this.bitbucketApi.getRepository();
    console.log(`Found repository: ${repository.full_name}`);

    const mainBranch = repository.mainbranch.name;
    console.log(`Main branch: ${mainBranch}`);

    const packageJson = await this.bitbucketApi.getFile(
      mainBranch,
      'package.json',
    );

    const npmPackage = await this.npmApi.getPackageInfo(packageName);

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

    console.log(`Updating ${packageName} in dependencies...`);
    await this.updateDependencies(
      packageJson.dependencies,
      packageName,
      packageVersion,
    );

    console.log(`Updating ${packageName} in devDependencies...`);
    await this.updateDependencies(
      packageJson.devDependencies,
      packageName,
      packageVersion,
    );

    const branch = await this.createBranch(
      packageName,
      packageVersion,
      mainBranch,
    );

    await this.commitChanges(branch, packageJson);

    await this.createPullRequest(
      branch,
      mainBranch,
      `Update ${packageName} to ${packageVersion}`,
    );
  }

  private async updateDependencies(
    deps: Record<string, string>,
    packageName: string,
    packageVersion: string,
  ) {
    if (packageName in deps && !deps[packageName].endsWith(packageVersion)) {
      console.log(`Updating ${packageName}...`);
      deps[packageName] = packageVersion;
    }
  }

  private async createBranch(
    packageName: string,
    packageVersion: string,
    mainBranch: string,
  ) {
    const branch = `deps/${packageName}-${packageVersion}`;
    console.log(`Checking out to new branch ${branch}...`);

    await this.bitbucketApi.createBranch(branch, mainBranch);

    return branch;
  }

  private async commitChanges(
    branch: string,
    packageJson: Record<string, string>,
  ) {
    console.log(`Creating commit...`);

    const newPackageJson = JSON.stringify(packageJson, null, 2);

    await this.bitbucketApi.editFile(branch, 'package.json', newPackageJson);

    console.log(`Commit created`);
  }

  private async createPullRequest(
    branch: string,
    mainBranch: string,
    message: string,
  ) {
    console.log(`Creating pull request...`);

    const pr = await this.bitbucketApi.createPullRequest(
      branch,
      mainBranch,
      message,
    );

    console.log(`PR created ${pr.links.html.href}`);
  }
}
