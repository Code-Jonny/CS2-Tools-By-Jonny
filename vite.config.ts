import { defineConfig, PluginOption } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { $ } from "execa";
import fs from "node:fs/promises";
import path from "node:path";
import archiver from "archiver";
import { createWriteStream } from "node:fs";

const neuConfig = JSON.parse(
  await fs.readFile("neutralino.config.json", "utf8")
);
const neuResourcesRoot = "." + neuConfig.cli.resourcesPath;

let launchedNeutralino = false;

/** Vite plugin to run Neutralino and build it when needed */
const neutralino = (): PluginOption => [
  {
    name: "vite-plugin-neutralino:copy-icon",
    enforce: "post",
    async buildStart() {
      // Copy the app icon when developing an app
      await fs.mkdir("./app", {
        recursive: true,
      });
      await fs.copyFile(
        "public/icon.png",
        path.join(neuResourcesRoot + "/icon.png")
      );
    },
  },
  {
    name: "vite-plugin-neutralino:serve",
    apply: "serve",
    enforce: "post",
    async configureServer(server) {
      // Start Neutralino when the Vite server starts and use Vite server
      server.httpServer?.once("listening", async () => {
        if (launchedNeutralino) {
          return;
        }
        const address = server.httpServer?.address();
        if (!address || typeof address === "string") {
          throw new Error("Failed to get server address");
        }
        const protocol = server.config.server.https ? "https" : "http",
          host = "127.0.0.1",
          port = address.port;
        await $`neu run -- --url=${protocol}://${host}:${port} --window-enable-inspector=true --icon=/app/icon.png`;
        launchedNeutralino = true;
      });
    },
  },
  {
    name: "vite-plugin-neutralino:build",
    apply: "build",
    enforce: "post",
    async closeBundle() {
      // Build Neutralino after Vite builds
      await $`neu build`;

      const binaryName = neuConfig.cli.binaryName;
      const binaryPath = path.resolve(
        path.join("./dist/", binaryName, binaryName + "-win_x64.exe")
      );
      const resourcesNeuPath = path.resolve(
        path.join("./dist/", binaryName, "resources.neu")
      );
      const powerPlansPath = path.resolve("./power_plans.exe");
      const bundleDir = path.resolve("./dist/bundle");
      const zipPath = path.join(bundleDir, `${binaryName}.zip`);

      try {
        await fs.mkdir(bundleDir, { recursive: true });

        const output = createWriteStream(zipPath);
        const archive = archiver("zip", {
          zlib: { level: 9 }, // Sets the compression level.
        });

        archive.pipe(output);
        archive.file(binaryPath, { name: path.basename(binaryPath) });
        archive.file(resourcesNeuPath, { name: "resources.neu" });
        archive.file(powerPlansPath, { name: "power_plans.exe" });
        await archive.finalize();

        console.log(
          `✓ Neutralino build completed. Zip bundle created at "${zipPath}".`
        );
      } catch (error) {
        console.error("Failed to create zip bundle:", error);
      }
    },
  },
];

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), neutralino()],
  server: {
    host: "127.0.0.1",
    open: false,
  },
  build: {
    outDir: neuResourcesRoot,
  },
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@src": path.resolve(__dirname, "./src"),
    },
  },
});
