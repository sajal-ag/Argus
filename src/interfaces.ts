import {
  DockerOptions,
  Container as ContainerInterface,
  ContainerInspectInfo,
  ContainerCreateOptions,
  ImageInspectInfo,
  ImageInfo,
} from 'dockerode';
import { SendMailOptions, SentMessageInfo } from 'nodemailer';
import { SmtpOptions } from 'nodemailer-smtp-transport';
import { DataService } from './metrics';

export type DockerInitOptions = DockerOptions;

export interface CliArgumentsInterface {
  [x: string]: unknown;
  runonce: boolean;
  cleanup: boolean;
  host: string | undefined;
  interval: number | undefined;
  monitor: string | null;
  ignore: string | null;
  user: string | null;
  pass: string | null;
  $0: string;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUsername?: string | null;
  smtpPassword?: string | null;
  smtpSender?: string | null;
  smtpRecipients?: string | null;
}

export interface ConfigInterface {
  runOnce: boolean;
  cleanImage: boolean;
  dockerHost: string | undefined;
  watchInterval: number | undefined;
  containersToMonitor: string[] | null;
  containersToIgnore: string[] | null;
  repoUser: string | null;
  repoPass: string | null;
  emailConfig?: SmtpOptions;
  emailOptions?: SendMailOptions;
  extractDockerConfig(): DockerInitOptions;
}

export interface ContainerClientInterface {
  client: any;
  create(
    createOpts: ContainerCreateOptions
  ): Promise<ContainerInterface | undefined>;
  getRunningContainers(): Promise<RunningContainerInfo[] | undefined>;
}

export interface ImageClientInterface {
  client: any;
  listAll(): Promise<ImageInfo[] | undefined>;
  inspect(name: string): Promise<ImageInspectInfo | undefined>;
  pullLatestImage(
    image: ImageInspectInfo,
    pullAuthCredentials: PullAuthInterface | undefined
  ): Promise<ImageInspectInfo | undefined>;
  remove(image: ImageInspectInfo): Promise<void>;
}

export interface ArgusClientInterface {
  DockerClient: any;
  ContainerClient: ContainerClientInterface;
  ImageClient: ImageClientInterface;
  NotificationClient: NotificationInterface;
  DataClient: DataServiceInterface;
  execute(): Promise<void>;
}

export interface RunningContainerInfo {
  inspectObject?: ContainerInspectInfo;
  interfaceObject?: ContainerInterface;
}

export interface PullAuthInterface {
  username: string;
  password: string;
  auth?: string;
  email?: string;
  serveraddress?: string;
}

export interface NotificationInterface {
  emailOpts: SendMailOptions;
  emailNotifier: EmailServiceInterface;
  sendNotifications(
    monitoredContainers: number | undefined,
    updatedContainers: number | undefined,
    updatedContainerObjects: [
      ImageInspectInfo,
      ImageInspectInfo,
      ContainerInspectInfo
    ][]
  ): Promise<void>;
}

export interface EmailServiceInterface {
  emailOptions: SendMailOptions;
  sendEmail(
    dockerHost: string | null,
    monitoredContainers: number | undefined,
    updatedContainers: number | undefined,
    updatedContainerObjects: [
      ImageInspectInfo,
      ImageInspectInfo,
      ContainerInspectInfo
    ][]
  ): Promise<SentMessageInfo | undefined>;
}

export interface DataServiceInterface {
  monitoredContainers: Map<string, number>;
  updatedContainers: Map<string, number>;
  updatedContainerObjects: [
    ImageInspectInfo,
    ImageInspectInfo,
    ContainerInspectInfo
  ][];
}
