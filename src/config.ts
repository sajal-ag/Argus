import {
  CliArgumentsInterface,
  ConfigInterface,
  DockerInitOptions,
} from './interfaces';

export class Config implements ConfigInterface {
  runOnce: boolean;
  cleanImage: boolean;
  dockerHost: string | undefined;
  watchInterval: number | undefined;
  containersToMonitor: string[] | null;
  containersToIgnore: string[] | null;
  repoUser: string | null;
  repoPass: string | null;

  constructor({
    runonce,
    cleanup,
    host,
    interval,
    monitor,
    ignore,
    user,
    pass,
  }: CliArgumentsInterface) {
    const toMonitor: string[] | undefined = monitor
      ? parseContainersToFilterInput(monitor)
      : [];
    const toIgnore: string[] | undefined = ignore
      ? parseContainersToFilterInput(ignore)
      : [];
    this.runOnce = runonce;
    this.cleanImage = cleanup;
    this.dockerHost = host;
    this.watchInterval = interval;
    this.containersToMonitor = toMonitor;
    this.containersToIgnore = toIgnore;
    this.repoUser = user || process.env.REPO_USER;
    this.repoPass = pass || process.env.REPO_PASS;
  }

  /**
   *  Return config object to initialize Docker Client according to available host
   *
   * @return {*}  {DockerInitOptions}
   * @memberof Config
   * @return {DockerInitOptions}
   */
  extractDockerConfig(): DockerInitOptions {
    const isValidUri: boolean = checkValidTCPUri(this.dockerHost);
    const dockerConfig: DockerInitOptions = isValidUri
      ? { host: this.dockerHost }
      : { socketPath: '/var/run/docker.sock' };
    return dockerConfig;
  }
}

/**
 * Model container names string (passed via CLI options) to array of names
 *
 * @param {(string | undefined)} containerstoMonitor
 * @return {(string[] | undefined)}
 */
function parseContainersToFilterInput(
  containerstoFilter: string | undefined
): string[] | undefined {
  return containerstoFilter.split(',');
}

/**
 * Checks whether user specified URI is a valid TCP URI
 *
 * @param {string} hostUri
 * @return {boolean}
 */
function checkValidTCPUri(hostUri: string): boolean {
  const regexForValidTCP = new RegExp(
    '^(?:tcp)s?://(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\\.)+(?:[A-Z]{2,6}\\.?|[A-Z0-9-]{2,}\\.?)|localhost|\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})(?::\\d+)?(?:/?|[/?]\\S+)$'
  );
  return regexForValidTCP.test(hostUri);
}
