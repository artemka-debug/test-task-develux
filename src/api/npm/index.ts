import axios from 'axios';

export class NpmApi {
  #api;

  constructor() {
    this.#api = axios.create({
      // TODO: support custom registry
      baseURL: 'https://registry.npmjs.org',
    });
  }

  async getPackageInfo(packageName: string) {
    const response = await this.#api.get(`/${packageName}`);
    return response.data;
  }
}
