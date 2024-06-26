import axios, { AxiosBasicCredentials, AxiosError } from 'axios';
import qs from 'qs';

export class BitbucketAPI {
  #api;

  constructor(
    auth: AxiosBasicCredentials,
    projectKey: string,
    repositorySlug: string,
  ) {
    this.#api = axios.create({
      baseURL: `https://api.bitbucket.org/2.0/repositories/${projectKey}/${repositorySlug}`,
      auth,
    });
  }

  async getRepository() {
    const response = await this.#api.get(`/`);
    return response.data;
  }

  async getFile(branch: string, filePath: string) {
    const response = await this.#api.get(`/src/${branch}/${filePath}`);

    return response.data;
  }

  async createBranch(branch: string, mainBranch: string) {
    try {
      const response = await this.#api.post(`/refs/branches`, {
        name: branch,
        target: {
          hash: mainBranch,
        },
      });

      return response.data;
    } catch (e) {
      const response = (e as AxiosError).response?.data as {
        data: { key: string };
      };

      if (response?.data?.key === 'BRANCH_ALREADY_EXISTS') {
        console.log(`Branch ${branch} already exists`);
        return;
      }

      throw e;
    }
  }

  async editFile(branch: string, filePath: string, content: string) {
    const response = await this.#api.post(
      `/src`,
      qs.stringify({
        message: `Update ${filePath}`,
        branch,
        [filePath]: content,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return response.data;
  }

  async createPullRequest(
    sourceBranch: string,
    destinationBranch: string,
    title: string,
  ) {
    const response = await this.#api.post(`/pullrequests`, {
      title,
      description: title,
      source: {
        branch: {
          name: sourceBranch,
        },
      },
      destination: {
        branch: {
          name: destinationBranch,
        },
      },
    });

    return response.data;
  }
}
