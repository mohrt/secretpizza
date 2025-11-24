# API Notes

## Potential API Adjustments Needed

When installing dependencies, verify the following APIs match the actual package exports:

### @bsv/sdk

The wallet utilities assume:
```typescript
import { PrivateKey, PublicKey, Address } from '@bsv/sdk'
```

If the package uses a different export structure, update `src/utils/wallet.ts` accordingly.

### secrets.js-grempe

The Shamir utilities assume:
- `secrets.share(hexSecret, shares, threshold)` returns array of hex strings
- `secrets.combine(shares)` combines shares and returns hex string
- `secrets.str2hex(str)` converts string to hex
- `secrets.hex2str(hex)` converts hex to string
- `secrets.extractShareComponents(share)` validates a share

If the API differs, update `src/utils/shamir.ts` accordingly.

### qrcode

The QR code utilities use:
- `QRCode.toDataURL(text, options)` - returns Promise<string>
- `QRCode.toCanvas(canvas, text, options)` - returns Promise<void>

This should match the standard qrcode package API.

## Testing

After installing dependencies, test each utility module to ensure the APIs match:
1. `src/utils/wallet.ts` - Test wallet generation
2. `src/utils/shamir.ts` - Test secret splitting/combining
3. `src/utils/qrcode.ts` - Test QR code generation

