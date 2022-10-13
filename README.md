# Authentication Server. V2.

The second version of my auth server used typescript, typeorm, express in the backend. The frontend uses svelte and socket.io.

## Features

- Use anywhere api.
- 2 factor authentication that allows biometrics, security key, etc.
- Dashboard to blacklist websites that subscribed.
- Unlimited security keys feature.

## Getting Started.

First clone the repository. Then cd into the backend directory.

```
git clone https://github.com/Stephen10121/authserverv2.git && cd authserverv2/backend
```

Install all the dependencies.

```
yarn
```

Run the startup script. (This auto-generates the environment variable keys.)

```
yarn startup
```

## Warning

The generated tokens and salt in the .env file (./backend/src/.env) are unique so dont delete them because the existing data need those tokens. Save the tokens and salt as a backup.

## End Warning

Then just start the server.

```
yarn start
```

## Real Life implementation

[GruzAuth](https://auth.gruzservices.com)
