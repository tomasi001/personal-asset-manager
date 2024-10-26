npm i -g @nestjs/cli
nest new personal-asset-manager
pnpm add @nestjs/jwt @nestjs/passport passport passport-http bearer token @types/passport-http @types/passport @types/passport-http-bearer @nestjs/config @privy-io/server-auth@latest
nest g module auth
nest g controller auth
nest g service auth

run my-privy-app (basic react app to log access token)
take access toen from console

Run Curl Command to Retrieve Our Own Access Token

```
curl -X POST http://localhost:3000/auth \
-H "Content-Type: application/json" \
-d '{"privyToken": <privy-access-token>}'
```

This will return our access token

```
{"accessToken": <our-access-token>}
```

Use this access token to authenticate calls to our backend

```
curl -X POST http://localhost:3000/auth/protected \
     -H "Authorization: Bearer <our-access-token>" \
    -H "Content-Type: application/json"
```
