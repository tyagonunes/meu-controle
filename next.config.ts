import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import { withSerwist } from "@serwist/turbopack";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default withSerwist(nextConfig);
