# Secret Pizza

A web application for generating BSV cold storage wallets, splitting them into Shamir Secret Shares, and printing QR codes for secure offline storage.

## Features

- 🔐 **Client-Side Wallet Generation**: All keys are generated in the browser, never sent to servers
- 🍕 **Shamir Secret Sharing**: Configurable splitting of private keys into multiple shares
- 📱 **QR Code Generation**: Print-friendly QR codes for each share
- ☁️ **AWS Hosting**: Static site hosted on S3 + CloudFront
- 🔗 **BSV Integration**: Built with `@bsv/sdk` and Project Babbage tools

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **BSV SDK**: `@bsv/sdk` for wallet operations
- **Shamir Sharing**: `secrets.js-grempe` for secret splitting
- **QR Codes**: `qrcode` for QR code generation
- **Infrastructure**: Terraform + AWS (S3 + CloudFront)
- **Future**: Project Babbage Metanet Wallet for paid features

## Development

### Prerequisites

- Node.js >= 18
- npm or yarn
- AWS CLI configured with `terraform-admin` profile

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Deployment

Deployment instructions are available in the infrastructure documentation.

## Infrastructure

See `terraform/README.md` for infrastructure setup instructions.

## Security

- All wallet generation happens client-side
- Private keys never leave the browser
- No server-side storage of sensitive data
- Shamir Secret Sharing for secure key distribution

## License

TBD

## Domain

Website will be hosted at [secretpizza.org](https://secretpizza.org)

