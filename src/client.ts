import {
  Container as ContainerInterface,
  ContainerCreateOptions,
  ContainerInspectInfo,
  ImageInspectInfo,
} from 'dockerode';
import {
  RunningContainerInfo,
  ConfigInterface,
  ContainerClientInterface,
  ImageClientInterface,
  ArgusClientInterface,
  PullAuthInterface,
  NotificationInterface,
  DataServiceInterface,
} from './interfaces';
import { Image } from './image';
import { Container } from './container';
import chalk from 'chalk';

export class Client implements ArgusClientInterface {
  private ClientConfig: ConfigInterface;
  DockerClient: any;
  ContainerClient: ContainerClientInterface;
  ImageClient: ImageClientInterface;
  NotificationClient: NotificationInterface;
  DataClient: DataServiceInterface;

  constructor(
    DockerClient: any,
    ContainerClient: ContainerClientInterface,
    ImageClient: ImageClientInterface,
    NotificationClient: NotificationInterface,
    DataClient: DataServiceInterface,
    ClientConfig: ConfigInterface
  ) {
    this.DockerClient = DockerClient;
    this.ContainerClient = ContainerClient;
    this.ImageClient = ImageClient;
    this.ClientConfig = ClientConfig;
    this.NotificationClient = NotificationClient;
    this.DataClient = DataClient;
  }

  async execute(): Promise<void | undefined> {
    const runningContainers:
      | RunningContainerInfo[]
      | undefined = await this.ContainerClient.getRunningContainers();

    if (runningContainers && !runningContainers.length) {
      console.log(`\n`, chalk.yellow('No running containers'), `\n\n`);
    } else {
      let count = 0;
      let containersToMonitor: RunningContainerInfo[] | undefined = [];
      try {
        containersToMonitor = Container.getRunningContainersToMonitor(
          runningContainers,
          this.ClientConfig.containersToMonitor,
          this.ClientConfig.containersToIgnore
        );
        this.DataClient.monitoredContainers.set(
          this.ClientConfig.dockerHost,
          containersToMonitor.length
        );
      } catch {
        console.log(
          chalk.red(
            `Containers to monitor intersect with containers to ignore!\nPlease try again with no overlaps.`
          ),
          `\n`
        );
        return Promise.resolve();
      }
      if (containersToMonitor.length == 0) {
        console.log(chalk.yellow('No running containers to monitor.'), `\n\n`);
      } else {
        // Non empty array of containers to be monitored
        for (const containerObject of containersToMonitor) {
          const containerInspect: ContainerInspectInfo =
            containerObject.inspectObject;
          const containerInterface: ContainerInterface =
            containerObject.interfaceObject;
          console.log(
            chalk.cyan(
              `Container to be updated: ${containerInspect['Name'].replace(
                '/',
                ''
              )}`
            ),
            `\n`
          );

          console.log(chalk.yellow('Checking locally for current image...'));
          const currentImage:
            | ImageInspectInfo
            | undefined = await this.ImageClient.inspect(
            containerInspect.Config.Image
          );
          let latestImage: ImageInspectInfo | undefined;

          try {
            console.log(
              chalk.yellow('Pulling latest image from registry...'),
              `\n`
            );
            let pullAuthCredentials: PullAuthInterface | undefined;
            if (this.ClientConfig.repoUser && this.ClientConfig.repoPass) {
              pullAuthCredentials = {
                username: this.ClientConfig.repoUser,
                password: this.ClientConfig.repoPass,
              };
            }
            latestImage = await this.ImageClient.pullLatestImage(
              currentImage,
              pullAuthCredentials
            );

            // Old image cleanup commences if container runs on outdated image (and a newer image is obtained above)
            if (latestImage && this.ClientConfig.cleanImage) {
              console.log(
                chalk.yellow(
                  `Removing outdated image: ${JSON.stringify(
                    currentImage.RepoTags
                  )}`
                ),
                `\n`
              );
              this.ImageClient.remove(currentImage);
            }
            // Container already running on latest image or a pull image error was encountered
            if (!latestImage) {
              if (this.ClientConfig.cleanImage) {
                console.log(
                  `Image cleanup inconsequential, current base image is the latest version.\n`
                );
              }
              continue;
            }
          } catch (err) {
            console.log(chalk.red(`Docker API error: ${err.message}`));
            continue;
          }

          if (Image.isUpdatedImage(currentImage.Id, latestImage.Id)) {
            const newConfig: ContainerCreateOptions = Container.newContainerConfig(
              containerInspect,
              latestImage.RepoTags[0]
            );
            await Container.stop(containerInterface);
            await Container.remove(containerInterface);
            const newContainer:
              | ContainerInterface
              | undefined = await this.ContainerClient.create(newConfig);
            await Container.start(newContainer);
            count += 1;

            this.DataClient.updatedContainerObjects.push([
              currentImage,
              latestImage,
              containerInspect,
            ]);
          }
        }
        this.DataClient.updatedContainers.set(
          this.ClientConfig.dockerHost,
          count
        );
      }
      // Send notifications
      try {
        await this.NotificationClient.sendNotifications(
          this.DataClient.monitoredContainers.get(this.ClientConfig.dockerHost),
          this.DataClient.updatedContainers.get(this.ClientConfig.dockerHost),
          this.DataClient.updatedContainerObjects
        );
      } catch (err) {
        console.log(chalk.red(`${err.message}`));
      }
      console.log(chalk.green(`${count} containers updated.`), `\n\n\n\n`);
    }
    // Return if single run enabled, perpetual otherwise (wrapped in setInterval)
    if (this.ClientConfig.runOnce) return Promise.resolve();
  }
}
