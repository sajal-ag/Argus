# Argus

![Argus](https://socialify.git.ci/VibhorCodecianGupta/Argus/image?description=1&language=1&pattern=Circuit%20Board&stargazers=1&theme=Light)

## Overview and Intent

A TypeScript-based alternative to [watchtower](https://github.com/v2tec/watchtower)

**Argus automatically updates your running Docker containers to the latest available image.**
The problem with managing docker images and containers manually, especially in an environment where containers are running across servers and need frequent updates due to constant images updates to the registry, is a series of CLI commands needed to update and rerun a container which quickly gets tiresome:

```
docker stop ...
docker rm ...
docker pull ...
docker run ...
```

Additionally, if you wish to cleanup redundant images, again `docker rmi -f ...`.

Argus automates the job of updating Docker containers in favour of latest images available in an image registry. Assuming a developer is publishing new versions of a Docker image frequently for an application that resides in containers deployed on local/remote servers, the dev needs a way to propogate the image update to these containers. Traditionally, after SSHing in the remote machine the dev has to stop the existing container, pull the latest image as base, and restart the container. The entire process requires running a series of commands that get tedious, quick.

Automating the process of watching your containers, looking for latest images on a remote registry, exiting the running container, pulling the latest image and running a new container with the updated base ensures keeping up to date with newer, stable versions.

---

## Usage

**NPM package**

`Argus` is available in the npm registry as a package. To use:

`yarn global add argus-docker` or `npm i -g argus-docker`

**Docker Image**

`Argus` is also deployed via docker image like so:

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus
```

- Remove the `-d` flag to run in foreground
- By default, running containers are polled every 300 seconds

### Options

All arguments can be used together without conflicts with the exception of `-u` and `-p`.

```
docker run --rm whaleit/argus --help
```

- `--host`, `-u`: Monitor and update containers on a remote system by providing its `host`. Defaults to `/var/run/docker.sock`
- `--interval`, `-i`: Change interval b/w Argus checking the remote docker registry for image updates (in seconds). Defaults to `300`
- `--monitor`, `-m`: Only monitor select containers by names. Defaults to all containers.
- `--ignore`, `-ig`: Ignore only select containers by names. Defaults to none.
- `--runonce`, `-r`: Update all running containers once and terminate. Defaults to `false`.
- `--cleanup`, `-c`: Remove the older base image if a new one is found and updated. Defaults to `false`.
- `--user`, `-u`: Specify username for private image registry. Defaults to `null`.
- `--password`, `-p`: Specify password for private image registry. Defaults to `null`.

`-u` and `-p` flags are to be used in conjunction as credentials in case of private image registry.

---

## Examples

### Update containers on a remote host

Argus can monitor things other than just local, pass the `--host` argument to update a system with the Docker API exposed.

Defaults to `/var/run/docker.sock`

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --host='tcp://some-remote-docker-server:2375'
```

2. Running the npm package

```bash
argus --host='tcp://some-remote-docker-server:2375'
```

### Change update interval

An `interval` argument can be supplied to change interval b/w argus checking the remote docker registry for image updates (in seconds).

Defaults to `300` seconds

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --interval=900
```

2. Running the npm package

```bash
argus --interval=900
```

### Monitor select containers

Argus monitors all running docker containers, but can be overridden to only monitor select containers by passing `monitor` supplied with container names.

Defaults to all containers

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --monitor='containerA','containerB','containerC'
```

2. Running the npm package

```bash
argus --monitor='containerA','containerB','containerC'
```

### Ignore select containers

Argus monitors all running docker containers, but can be overridden to ignore select containers by passing `ignore` supplied with container names.

Defaults to none

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --ignore='containerA','containerB'
```

2. Running the npm package

```bash
argus --ignore='containerA','containerB'
```

### Update all containers once and quit

If you prefer Argus didn't run all the time and only update running containers once and exit, use the `runonce` argument and Argus terminates after updating all containers once.

Defaults to `false`

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --runonce=true
```

2. Running the npm package

```bash
argus --runonce=true
```

### Remove old docker images

Argus has the option to remove the outdated base image if a new one is found and the container is updated. To clean up after updates, pass the `cleanup` argument.

Defaults to `false`

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --cleanup=true
```

2. Running the npm package

```bash
argus --cleanup=true
```

### Private Registries

If base images to running containers are stored in a secure registry that requires credentials, you can run Argus with 2 arguments `--user` and `--password`.

1. Running the docker image

```bash
docker run -d --name argus \
  -v /var/run/docker.sock:/var/run/docker.sock \
  whaleit/argus --user='myUser' --password='myPassword'
```

2. Running the npm package

```bash
argus --user='myUser' --password='myPassword'
```

Credentials can also be passed via environment variables. Set the environment vars in your command line environment prior to running Argus like so:

```bash
export REPO_USER=myUser
export REPO_PASS=myPassword
```

---

## Development

### Under the hood

- [Docker SDK](https://github.com/apocas/dockerode)
- [Typescript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/)
- [Yarn](https://classic.yarnpkg.com/en/docs/)

### Installation

Ensure you have the Docker engine installed and running. To setup a local copy, follow these simple steps.

```
npm i -g typescript
git clone https://github.com/VibhorCodecianGupta/Argus.git
yarn install
```

### Running a prod build

```
yarn run build
yarn run start
```

### Running in dev mode

```
yarn run dev
```

---

## Contributing

Any and all contributions are welcome. You can check out Issue tracker and ongoing projects to look for existing issues and start contributing.

Feel free to open issues for any bugs you discover or any feature ideas you have. Do make sure to open an issue before moving to implementation. This ensures sufficient discussion and context to incoming PRs.

1. Fork the Project
2. Create your feature breanch: `git checkout -b feature-branch`
3. Commit your Changes: `git commit -m "Add some feature"`
4. Push to your fork: `git push origin feature-branch`
5. Open a Pull Request.

If you like what you see, leave a star :)
