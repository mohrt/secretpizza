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

MIT License

Copyright (c) 2025 Secret Pizza

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Domain

Website will be hosted at [secretpizza.org](https://secretpizza.org)

