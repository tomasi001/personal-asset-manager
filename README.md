# Personal Asset Manager

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## Description

Personal Asset Manager is a NestJS-based application that allows users to securely manage their digital assets. It provides features for asset tracking, portfolio management, and user authentication using Privy.io.

## Features

- User authentication via Privy.io
- Asset management (ERC-20 and ERC-721 tokens)
- Portfolio valuation and performance tracking
- Historical asset value and PnL analysis
- Mock daily price updates for assets

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v21)
- pnpm (v9)
- Docker
- Docker Compose (usually included with Docker Desktop for Windows and Mac, but may need separate installation on Linux)
- A Privy.io account and [Privy Access Token Retriever App](https://github.com/tomasi001/get-privy-access-token)

The test app is a simple React app that displays your Privy token. To use it:

1. Clone the repository
2. Install dependencies
3. Add your Privy App ID to the .env
4. Run the app
5. Login

This process is super easy and quick, allowing you to quickly obtain your Privy token for testing purposes.

## Project Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/tomasi001/personal-asset-manager.git
   cd personal-asset-manager
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   - Rename `.example.env` to `.env` in the root directory
   - Update the variables, including your Privy.io app ID and private key

4. Set up the database:

   ```bash
   set -o allexport; source .env; set +o allexport
   docker compose up -d
   pnpm run migrate
   ```

## Running the Application

1. Start the development server:

   ```bash
   pnpm run start:dev
   ```

2. The application will be available at `http://localhost:3000`

## API Documentation

Swagger UI is available for API documentation. After starting the application, visit:

`http://localhost:3000/api`

To authenticate:

1. Open the auth dropdown
2. Click "Try it out"
3. Paste your Privy access token into the request body
4. Click "Execute"
5. Copy the access token from the response
6. Scroll to the top of the Swagger UI page and click "Authorize"
7. Enter the JWT access token
8. Click "Authorize"

You are now authorized to use any of the API endpoints.

## Testing

1. Run unit tests:

   ```bash
   pnpm run test
   ```

2. Run e2e tests:

   ```bash
   pnpm run test:e2e
   ```

3. Generate test coverage report:
   ```bash
   pnpm run test:cov
   ```

## Database Seeding

To quickly test the application with sample data:

1. View `src/db/seed` for various seeding utility scripts
2. Seed your database with users, assets, user_assets, and asset_daily_prices
3. Use the clear table script to reset the database

Available seeding scripts:

```bash
pnpm run seed
pnpm run seed-no-assets
pnpm run seed-losses
pnpm run seed-mixed
pnpm run clear-db
```

**Important Note on Privy ID in DB Seed Scripts:**

- Log in to Privy to obtain your access token
- Use the token to authenticate through the Swagger API
- After first authentication, your Privy ID will be stored in the database
- Use this Privy ID in your seed scripts for consistent user simulation

## Authentication Architecture

## Authentication Architecture

<p align="center">
  <img src="https://github.com/tomasi001/personal-asset-manager/blob/main/auth-architecture.PNG?raw=true" alt="Authentication Architecture" width="700">
</p>

This diagram illustrates the complete authentication flow in our Personal Asset Manager application:

1. The client initiates authentication with Privy.
2. Privy returns a JWT to the client.
3. The client sends this Privy JWT to our backend's /auth endpoint.
4. Our backend verifies the Privy JWT with Privy's authentication service.
5. If the JWT is valid:
   - The backend checks if the user exists in our database.
   - If the user doesn't exist, a new user is created.
   - Our backend generates its own JWT.
   - This JWT is returned to the client for future requests.
6. If the Privy JWT is invalid, a 403 Forbidden response is sent to the client.
7. For all subsequent requests, the client uses our JWT to access protected resources.
8. The backend validates our JWT and provides access to protected resources.

This flow ensures secure authentication using Privy while maintaining our
own user management system and securing all subsequent API calls.

## CI/CD

This project uses GitHub Actions for CI/CD. The pipeline includes:

- Dependency installation
- Linting
- Building the application
- Running tests (if implemented)

The pipeline runs on every pull request to ensure code quality and consistency.
