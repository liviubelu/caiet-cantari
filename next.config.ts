import type { NextConfig } from "next"
import pkg from "./package.json"

const nextConfig: NextConfig = {
  env: {
    // Exposed to the client — used in the account page version display.
    // Automatically updated by the GitHub Actions version-bump workflow.
    NEXT_PUBLIC_APP_VERSION: pkg.version,
  },
}

export default nextConfig
