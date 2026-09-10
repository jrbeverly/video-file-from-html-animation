import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import puppeteer from "puppeteer";

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 30;
const DURATION = 60;
const BITRATE = 8_000_000;
const root = fileURLToPath(new URL(".", import.meta.url));
const output = path.join(root, "starting-soon.mp4");

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const file = pathname === "/" ? "www/index.html" : pathname.slice(1);

  try {
    response.setHeader(
      "Content-Type",
      file.endsWith(".js") ? "text/javascript" : "text/html",
    );
    response.end(await readFile(path.join(root, file)));
  } catch {
    response.statusCode = 404;
    response.end();
  }
});

server.listen(0, "127.0.0.1");
await once(server, "listening");

const encoder = spawn(
  "ffmpeg",
  [
    "-y",
    "-loglevel",
    "error",
    "-fflags",
    "+genpts",
    "-r",
    String(FPS),
    "-f",
    "h264",
    "-i",
    "pipe:0",
    "-c:v",
    "copy",
    "-movflags",
    "+faststart",
    output,
  ],
  { stdio: ["pipe", "inherit", "inherit"] },
);

const browser = await puppeteer.launch({
  headless: true,
  defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
  args: ["--no-sandbox"],
});

try {
  const page = await browser.newPage();

  await page.exposeFunction("writeEncodedBatch", async (base64) => {
    if (!encoder.stdin.write(Buffer.from(base64, "base64"))) {
      await once(encoder.stdin, "drain");
    }
  });

  await page.exposeFunction("reportProgress", (frame, total) => {
    console.log(`Rendered ${frame} / ${total} frames`);
  });

  const address = server.address();
  await page.goto(`http://127.0.0.1:${address.port}/?capture`, {
    waitUntil: "networkidle0",
  });
  await page.waitForFunction(() => window.captureReady === true);

  const result = await page.evaluate(
    async ({ width, height, fps, duration, bitrate }) => {
      if (!("VideoEncoder" in window))
        throw new Error("Chromium does not expose WebCodecs VideoEncoder");

      const config = {
        codec: "avc1.420028",
        width,
        height,
        bitrate,
        framerate: fps,
        latencyMode: "realtime",
        hardwareAcceleration: "prefer-software",
        avc: { format: "annexb" },
      };
      const support = await VideoEncoder.isConfigSupported(config);
      if (!support.supported)
        throw new Error("Chromium cannot encode the requested H.264 format");

      const chunks = [];
      let encodingError;
      const videoEncoder = new VideoEncoder({
        output(chunk) {
          const bytes = new Uint8Array(chunk.byteLength);
          chunk.copyTo(bytes);
          chunks.push(bytes);
        },
        error(error) {
          encodingError = error;
        },
      });
      videoEncoder.configure(support.config);

      const canvas = document.getElementById("stage");
      const total = duration * fps;
      const frameDuration = Math.round(1_000_000 / fps);

      for (let index = 0; index < total; index++) {
        window.renderAt(index / fps);
        const frame = new VideoFrame(canvas, {
          timestamp: index * frameDuration,
          duration: frameDuration,
        });
        videoEncoder.encode(frame, { keyFrame: index % (fps * 2) === 0 });
        frame.close();

        while (videoEncoder.encodeQueueSize > 8) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        if ((index + 1) % (fps * 5) === 0)
          await window.reportProgress(index + 1, total);
      }

      await videoEncoder.flush();
      videoEncoder.close();
      if (encodingError) throw encodingError;

      let batch = [];
      let size = 0;
      for (const chunk of chunks) {
        batch.push(chunk);
        size += chunk.byteLength;
        if (size < 4_000_000) continue;
        const data = await new Blob(batch).arrayBuffer();
        const bytes = new Uint8Array(data);
        let binary = "";
        for (let offset = 0; offset < bytes.length; offset += 32768) {
          binary += String.fromCharCode(
            ...bytes.subarray(offset, offset + 32768),
          );
        }
        await window.writeEncodedBatch(btoa(binary));
        batch = [];
        size = 0;
      }

      if (batch.length) {
        const data = await new Blob(batch).arrayBuffer();
        const bytes = new Uint8Array(data);
        let binary = "";
        for (let offset = 0; offset < bytes.length; offset += 32768) {
          binary += String.fromCharCode(
            ...bytes.subarray(offset, offset + 32768),
          );
        }
        await window.writeEncodedBatch(btoa(binary));
      }

      return { frames: total, codec: support.config.codec };
    },
    {
      width: WIDTH,
      height: HEIGHT,
      fps: FPS,
      duration: DURATION,
      bitrate: BITRATE,
    },
  );

  encoder.stdin.end();
  const [exitCode] = await once(encoder, "close");
  if (exitCode !== 0) throw new Error(`FFmpeg exited with code ${exitCode}`);

  console.log(`Wrote ${result.frames} ${result.codec} frames to ${output}`);
} finally {
  await browser.close();
  server.close();
}
