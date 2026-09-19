#!/usr/bin/env node

import {
  mkdtemp,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";

import {
  randomBytes
} from "node:crypto";

import {
  tmpdir
} from "node:os";

import {
  dirname,
  join,
  resolve
} from "node:path";

import {
  fileURLToPath
} from "node:url";

import {
  spawnSync
} from "node:child_process";

import readline from "node:readline/promises";

const HERE =
  dirname(
    fileURLToPath(
      import.meta.url
    )
  );

const ROOT =
  resolve(
    HERE,
    ".."
  );

const WORKER_DIR =
  join(
    ROOT,
    "backend",
    "cloudflare-workers-ai"
  );

const BASE_CONFIG =
  join(
    WORKER_DIR,
    "wrangler.jsonc"
  );

const WRANGLER_MIN =
  [4, 102, 0];

const ORIGIN =
  "https://gmoon-code.github.io";

const FREE_MODEL =
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const CONTENT_BINDING =
  "RMS_CONTENT_COORDINATOR";

const CONTENT_CLASS =
  "ContentReleaseCoordinator";

function fail(
  message,
  code = 1
) {
  console.error(
    `\nCLOUDFLARE V3 DEPLOYMENT: FAIL\n${message}`
  );

  process.exit(code);
}

function parseVersion(text) {
  const match =
    String(text || "")
      .match(
        /(\d+)\.(\d+)\.(\d+)/
      );

  return match
    ? match
        .slice(1, 4)
        .map(Number)
    : null;
}

function versionAtLeast(
  actual,
  minimum
) {
  for (
    let index = 0;
    index < 3;
    index += 1
  ) {
    if (
      actual[index] >
      minimum[index]
    ) {
      return true;
    }

    if (
      actual[index] <
      minimum[index]
    ) {
      return false;
    }
  }

  return true;
}

function command(name) {
  return process.platform ===
    "win32"
      ? `${name}.cmd`
      : name;
}

function runCapture(
  executable,
  args,
  cwd = ROOT,
  env = process.env
) {
  return spawnSync(
    executable,
    args,
    {
      cwd,
      env,
      encoding: "utf8",
      windowsHide: true
    }
  );
}

function runInteractive(
  executable,
  args,
  cwd = ROOT,
  env = process.env
) {
  const result =
    spawnSync(
      executable,
      args,
      {
        cwd,
        env,
        stdio: "inherit",
        windowsHide: true
      }
    );

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

async function hiddenPrompt(label) {
  if (
    !process.stdin.isTTY ||
    !process.stdout.isTTY ||
    typeof process.stdin
      .setRawMode !==
      "function"
  ) {
    throw new Error(
      "Secret entry requires Terminal, PowerShell, or Command Prompt."
    );
  }

  process.stdout.write(label);

  const stdin =
    process.stdin;

  const wasRaw =
    Boolean(
      stdin.isRaw
    );

  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding(
    "utf8"
  );

  return await new Promise(
    (
      resolvePrompt,
      rejectPrompt
    ) => {
      let value = "";

      const cleanup = () => {
        stdin.off(
          "data",
          onData
        );

        stdin.setRawMode(
          wasRaw
        );

        process.stdout.write(
          "\n"
        );
      };

      const onData = chunk => {
        for (
          const character
          of String(chunk)
        ) {
          if (
            character ===
            "\u0003"
          ) {
            cleanup();

            rejectPrompt(
              new Error(
                "Cancelled."
              )
            );

            return;
          }

          if (
            character === "\r" ||
            character === "\n"
          ) {
            cleanup();

            resolvePrompt(
              value
            );

            return;
          }

          if (
            character ===
              "\u007f" ||
            character === "\b"
          ) {
            value =
              value.slice(
                0,
                -1
              );

            continue;
          }

          if (
            character >= " "
          ) {
            value += character;
          }
        }
      };

      stdin.on(
        "data",
        onData
      );
    }
  );
}

async function yesNo(
  question,
  defaultYes = true
) {
  const rl =
    readline.createInterface({
      input:
        process.stdin,
      output:
        process.stdout
    });

  try {
    const answer =
      (
        await rl.question(
          question +
          (
            defaultYes
              ? " [Y/n] "
              : " [y/N] "
          )
        )
      )
        .trim()
        .toLowerCase();

    if (!answer) {
      return defaultYes;
    }

    return (
      answer === "y" ||
      answer === "yes"
    );
  } finally {
    rl.close();
  }
}

function extractWorkerUrl(text) {
  const matches =
    String(text || "")
      .match(
        /https:\/\/[A-Za-z0-9.-]+\.workers\.dev(?:\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]*)?/g
      ) || [];

  return matches.length
    ? matches[
        matches.length - 1
      ].replace(
        /[),.;]+$/,
        ""
      )
    : "";
}

async function packagePreflight() {
  const nodeMajor =
    Number(
      process.versions.node
        .split(".")[0]
    );

  if (
    !Number.isInteger(
      nodeMajor
    ) ||
    nodeMajor < 20
  ) {
    throw new Error(
      `Node.js 20+ is required; detected ${process.versions.node}.`
    );
  }

  for (
    const path
    of [
      join(
        WORKER_DIR,
        "worker.mjs"
      ),
      BASE_CONFIG,
      join(
        WORKER_DIR,
        "package.json"
      ),
      join(
        WORKER_DIR,
        "content-api.mjs"
      ),
      join(
        WORKER_DIR,
        "content-durable-object.mjs"
      ),
      join(
        WORKER_DIR,
        "content-coordinator-core.mjs"
      ),
      join(
        WORKER_DIR,
        "content-coordinator-client.mjs"
      ),
      join(
        ROOT,
        "scripts",
        "configure-chat-endpoint.mjs"
      ),
      join(
        ROOT,
        "scripts",
        "test-production-chat.mjs"
      ),
      join(
        ROOT,
        "scripts",
        "test-production-content.mjs"
      ),
      join(
        ROOT,
        "assets",
        "runtime-config.js"
      )
    ]
  ) {
    await readFile(path);
  }

  const config =
    JSON.parse(
      await readFile(
        BASE_CONFIG,
        "utf8"
      )
    );

  const requiredSecrets =
    new Set(
      config?.secrets
        ?.required ||
      []
    );

  const expectedSecrets =
    new Set([
      "RMS_CHAT_ACCESS_CODE",
      "RMS_TEACHER_ACCESS_CODE",
      "RMS_TEACHER_SESSION_SECRET"
    ]);

  const secretMismatch =
    requiredSecrets.size !==
      expectedSecrets.size ||
    [...expectedSecrets]
      .some(
        name =>
          !requiredSecrets.has(
            name
          )
      );

  if (secretMismatch) {
    throw new Error(
      "wrangler.jsonc must require exactly the class code, Admin access code, and Admin session signing secret."
    );
  }

  if (
    config?.ai?.binding !==
    "AI"
  ) {
    throw new Error(
      "wrangler.jsonc must declare the Cloudflare Workers AI binding as AI."
    );
  }

  if (
    config?.vars
      ?.RMS_AI_MODEL !==
    FREE_MODEL
  ) {
    throw new Error(
      `RMS_AI_MODEL must remain ${FREE_MODEL} for this verified free deployment path.`
    );
  }

  if (
    config?.vars
      ?.RMS_ALLOWED_ORIGINS !==
    ORIGIN
  ) {
    throw new Error(
      `RMS_ALLOWED_ORIGINS must be exactly ${ORIGIN}.`
    );
  }

  const rateNames =
    new Set(
      (
        config.ratelimits ||
        []
      ).map(
        item =>
          item?.name
      )
    );

  for (
    const name
    of [
      "AUTH_RATE_LIMITER",
      "SESSION_RATE_LIMITER",
      "CLASS_RATE_LIMITER"
    ]
  ) {
    if (
      !rateNames.has(name)
    ) {
      throw new Error(
        `Missing rate-limit binding: ${name}`
      );
    }
  }

  const durableBindings =
    Array.isArray(
      config?.durable_objects
        ?.bindings
    )
      ? config
          .durable_objects
          .bindings
      : [];

  const contentBinding =
    durableBindings.find(
      item =>
        item?.name ===
        CONTENT_BINDING
    );

  if (
    !contentBinding ||
    contentBinding.class_name !==
      CONTENT_CLASS
  ) {
    throw new Error(
      `wrangler.jsonc must bind ${CONTENT_BINDING} to ${CONTENT_CLASS}.`
    );
  }

  const contentExport =
    config?.exports
      ?.[CONTENT_CLASS];

  if (
    contentExport?.type !==
      "durable-object" ||
    contentExport?.storage !==
      "sqlite"
  ) {
    throw new Error(
      `${CONTENT_CLASS} must be declared as a SQLite-backed Durable Object export.`
    );
  }

  if (
    Array.isArray(
      config?.kv_namespaces
    ) &&
    config.kv_namespaces
      .some(
        item =>
          /RMS_CONTENT/i
            .test(
              String(
                item?.binding ||
                ""
              )
            )
      )
  ) {
    throw new Error(
      "Content publication must not use Workers KV."
    );
  }

  const pkg =
    JSON.parse(
      await readFile(
        join(
          WORKER_DIR,
          "package.json"
        ),
        "utf8"
      )
    );

  const wranglerVersion =
    parseVersion(
      String(
        pkg?.devDependencies
          ?.wrangler ||
        ""
      )
    );

  if (
    !wranglerVersion ||
    !versionAtLeast(
      wranglerVersion,
      WRANGLER_MIN
    )
  ) {
    throw new Error(
      "Wrangler 4.102.0+ is required."
    );
  }

  console.log(
    "PASS v3 zero-cost package preflight"
  );

  console.log(
    `PASS SQLite Durable Object binding: ${CONTENT_BINDING} -> ${CONTENT_CLASS}`
  );

  console.log(
    "PASS no Workers KV content binding"
  );

  console.log(
    "PASS Workers AI binding remains AI"
  );

  console.log(
    `PASS free-model release lock: ${FREE_MODEL}`
  );

  console.log(
    "PASS no AI provider API key required"
  );

  console.log(
    `PASS GitHub Pages origin: ${ORIGIN}`
  );
}

async function main() {
  const checkOnly =
    process.argv
      .slice(2)
      .includes(
        "--check"
      );

  await packagePreflight();

  if (checkOnly) {
    console.log(
      "CLOUDFLARE V3 DEPLOYMENT HELPER CHECK: PASS"
    );

    return;
  }

  console.log(
    "\nZERO-COST REQUIREMENT"
  );

  console.log(
    "Use a Cloudflare Workers Free account. Do not upgrade Workers and do not enable prepaid AI Gateway billing."
  );

  console.log(
    "The content release coordinator uses a SQLite-backed Durable Object available on Workers Free."
  );

  if (
    !(
      await yesNo(
        "Confirm you intend to keep this deployment on Cloudflare Workers Free with no paid AI billing.",
        false
      )
    )
  ) {
    throw new Error(
      "Deployment cancelled."
    );
  }

  const npm =
    command("npm");

  const npx =
    command("npx");

  console.log(
    "\nInstalling package-scoped Wrangler..."
  );

  if (
    runInteractive(
      npm,
      [
        "install",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund"
      ],
      WORKER_DIR
    ) !== 0
  ) {
    throw new Error(
      "npm install failed."
    );
  }

  const versionResult =
    runCapture(
      npx,
      [
        "wrangler",
        "--version"
      ],
      WORKER_DIR
    );

  const version =
    parseVersion(
      `${versionResult.stdout || ""}\n${versionResult.stderr || ""}`
    );

  if (
    versionResult.status !== 0 ||
    !version ||
    !versionAtLeast(
      version,
      WRANGLER_MIN
    )
  ) {
    throw new Error(
      "Wrangler version check failed."
    );
  }

  console.log(
    `PASS Wrangler ${version.join(".")}`
  );

  let who =
    runCapture(
      npx,
      [
        "wrangler",
        "whoami"
      ],
      WORKER_DIR
    );

  if (who.status !== 0) {
    console.log(
      "\nCloudflare sign-in is required. A browser window will open."
    );

    if (
      runInteractive(
        npx,
        [
          "wrangler",
          "login",
          "--use-keyring"
        ],
        WORKER_DIR
      ) !== 0
    ) {
      throw new Error(
        "Cloudflare login failed."
      );
    }

    who =
      runCapture(
        npx,
        [
          "wrangler",
          "whoami"
        ],
        WORKER_DIR
      );
  }

  if (who.status !== 0) {
    throw new Error(
      "Wrangler is not authenticated."
    );
  }

  const classCode =
    (
      await hiddenPrompt(
        "Enter RMS_CHAT_ACCESS_CODE, 16-256 characters (input hidden): "
      )
    ).trim();

  if (
    classCode.length < 16 ||
    classCode.length > 256
  ) {
    throw new Error(
      "RMS_CHAT_ACCESS_CODE must be 16-256 characters."
    );
  }

  const adminCode =
    (
      await hiddenPrompt(
        "Enter RMS_TEACHER_ACCESS_CODE, 16-256 characters (input hidden): "
      )
    ).trim();

  if (
    adminCode.length < 16 ||
    adminCode.length > 256
  ) {
    throw new Error(
      "RMS_TEACHER_ACCESS_CODE must be 16-256 characters."
    );
  }

  const adminSessionSecret =
    randomBytes(48)
      .toString(
        "base64url"
      );

  const tempDir =
    await mkdtemp(
      join(
        tmpdir(),
        "rms-v3-cloudflare-secret-"
      )
    );

  const secretFile =
    join(
      tempDir,
      "secrets.json"
    );

  try {
    await writeFile(
      secretFile,
      JSON.stringify({
        RMS_CHAT_ACCESS_CODE:
          classCode,
        RMS_TEACHER_ACCESS_CODE:
          adminCode,
        RMS_TEACHER_SESSION_SECRET:
          adminSessionSecret
      }),
      {
        encoding:
          "utf8",
        mode: 0o600
      }
    );

    console.log(
      "\nDeploying the v3 Worker with the SQLite content release coordinator..."
    );

    const deployed =
      runCapture(
        npx,
        [
          "wrangler",
          "deploy",
          "--strict",
          "--secrets-file",
          secretFile
        ],
        WORKER_DIR
      );

    process.stdout.write(
      deployed.stdout || ""
    );

    process.stderr.write(
      deployed.stderr || ""
    );

    if (
      deployed.status !== 0
    ) {
      throw new Error(
        "Cloudflare Worker deployment failed. runtime-config.js was not changed."
      );
    }

    const endpoint =
      extractWorkerUrl(
        `${deployed.stdout || ""}\n${deployed.stderr || ""}`
      );

    if (!endpoint) {
      throw new Error(
        "Deployment succeeded, but the workers.dev endpoint could not be detected."
      );
    }

    const configured =
      runCapture(
        process.execPath,
        [
          join(
            ROOT,
            "scripts",
            "configure-chat-endpoint.mjs"
          ),
          endpoint
        ],
        ROOT
      );

    process.stdout.write(
      configured.stdout || ""
    );

    process.stderr.write(
      configured.stderr || ""
    );

    if (
      configured.status !== 0
    ) {
      throw new Error(
        "Worker deployed, but runtime-config.js could not be updated safely."
      );
    }

    if (
      await yesNo(
        "Run the real content publication and rollback canary now.",
        true
      )
    ) {
      const contentEnv = {
        ...process.env,
        RMS_CONTENT_ENDPOINT:
          endpoint,
        RMS_TEACHER_ACCESS_CODE:
          adminCode,
        RMS_CONTENT_ORIGIN:
          ORIGIN
      };

      if (
        runInteractive(
          process.execPath,
          [
            join(
              ROOT,
              "scripts",
              "test-production-content.mjs"
            )
          ],
          ROOT,
          contentEnv
        ) !== 0
      ) {
        throw new Error(
          "Worker deployed, but the production content canary failed."
        );
      }
    } else {
      console.log(
        "Content canary skipped. Content publication remains NOT YET GO."
      );
    }

    if (
      await yesNo(
        "Run one real free Workers AI smoke test now.",
        true
      )
    ) {
      const smokeEnv = {
        ...process.env,
        RMS_CHAT_ENDPOINT:
          endpoint,
        RMS_CHAT_ACCESS_CODE:
          classCode,
        RMS_CHAT_ORIGIN:
          ORIGIN
      };

      if (
        runInteractive(
          process.execPath,
          [
            join(
              ROOT,
              "scripts",
              "test-production-chat.mjs"
            )
          ],
          ROOT,
          smokeEnv
        ) !== 0
      ) {
        throw new Error(
          "Worker deployed, but the production Research Chat smoke test failed."
        );
      }
    } else {
      console.log(
        "Research Chat smoke test skipped."
      );
    }

    console.log(
      "\nCLOUDFLARE V3 DEPLOYMENT: COMPLETE"
    );

    console.log(
      `Worker endpoint: ${endpoint}`
    );

    console.log(
      `Content coordinator: ${CONTENT_BINDING} -> ${CONTENT_CLASS} (SQLite)`
    );

    console.log(
      "The public student application still ignores remote content until the later public-loader milestone."
    );
  } finally {
    await rm(
      tempDir,
      {
        recursive: true,
        force: true
      }
    ).catch(
      () => {}
    );
  }
}

main()
  .catch(
    error =>
      fail(
        error?.message ||
        String(error)
      )
  );
