// Verify the current wallet app and public pages. Contract payment flows run with npm test.
// This check never signs or sends a transaction on the public testnet.
await import("./review-pages.mjs");
