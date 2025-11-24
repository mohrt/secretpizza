# Terraform Infrastructure for Secret Pizza

This directory contains Terraform configuration for deploying the Secret Pizza website to AWS.

## Prerequisites

- Terraform >= 1.0 installed
- AWS CLI configured with `terraform-admin` profile
- Domain `secretpizza.org` registered (DNS will be configured separately)

## Setup

1. Ensure your AWS profile is configured:
   ```bash
   aws configure --profile terraform-admin
   ```

2. Initialize Terraform:
   ```bash
   cd terraform
   terraform init
   ```

3. Review the plan:
   ```bash
   terraform plan
   ```

4. Apply the configuration:
   ```bash
   terraform apply
   ```

## Infrastructure Components

- **S3 Bucket**: Static website hosting
- **CloudFront Distribution**: CDN with HTTPS
- **ACM Certificate**: SSL/TLS certificate for the domain
- **Origin Access Identity**: Secure access from CloudFront to S3

## DNS Configuration

After applying the Terraform configuration:

1. Get the CloudFront distribution domain name:
   ```bash
   terraform output cloudfront_domain_name
   ```

2. Get the certificate validation records:
   ```bash
   terraform output certificate_validation_records
   ```

3. Add DNS records:
   - **Production**: Create a CNAME record for `secretpizza.org` pointing to the production CloudFront domain (when ready)
   - **Production**: Create a CNAME record for `www.secretpizza.org` pointing to the production CloudFront domain (when ready)
   - **Dev**: Create a CNAME record for `dev.secretpizza.org` pointing to the dev CloudFront domain
   - Add the certificate validation CNAME records to your DNS (includes dev.secretpizza.org)

## Deploying the Website

### Production Deployment

After infrastructure is set up, deploy the built website to S3:

```bash
aws s3 sync dist/ s3://secretpizza.org/ --profile terraform-admin --delete
aws cloudfront create-invalidation --distribution-id <PRODUCTION_DISTRIBUTION_ID> --paths "/*" --profile terraform-admin
```

### Dev/Staging Deployment

Deploy to the dev environment:

```bash
aws s3 sync dist/ s3://dev.secretpizza.org/ --profile terraform-admin --delete
aws cloudfront create-invalidation --distribution-id <DEV_DISTRIBUTION_ID> --paths "/*" --profile terraform-admin
```

Get the distribution IDs:
```bash
terraform output cloudfront_distribution_id
terraform output dev_cloudfront_distribution_id
```

