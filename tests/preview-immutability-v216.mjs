import { readFile, access, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createServer as createNetServer } from 'node:net';
import { createServer as createHttpServer } from 'node:http';
import {
  extname,
  isAbsolute,
  join,
  relative,
  resolve
} from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const ROOT = resolve(
  fileURLToPath(
    new URL('..', import.meta.url)
  )
);

const sleep = ms =>
  new Promise(resolvePromise =>
    setTimeout(resolvePromise, ms)
  );

function browserCandidates() {
  const candidates = [
    process.env.CHROMIUM,
    process.env.CHROME,
    process.env.CHROME_PATH
  ];

  if (process.platform === 'win32') {
    const pf = process.env.PROGRAMFILES;
    const pf86 = process.env['PROGRAMFILES(X86)'];
    const local = process.env.LOCALAPPDATA;

    if (pf) {
      candidates.push(
        join(
          pf,
          'Google',
          'Chrome',
          'Application',
          'chrome.exe'
        ),
        join(
          pf,
          'Microsoft',
          'Edge',
          'Application',
          'msedge.exe'
        )
      );
    }

    if (pf86) {
      candidates.push(
        join(
          pf86,
          'Google',
          'Chrome',
          'Application',
          'chrome.exe'
        ),
        join(
          pf86,
          'Microsoft',
          'Edge',
          'Application',
          'msedge.exe'
        )
      );
    }

    if (local) {
      candidates.push(
        join(
          local,
          'Google',
          'Chrome',
          'Application',
          'chrome.exe'
        ),
        join(
          local,
          'Microsoft',
          'Edge',
          'Application',
          'msedge.exe'
        )
      );
    }
  } else {
    candidates.push(
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable'
    );
  }

  return [
    ...new Set(
      candidates.filter(Boolean)
    )
  ];
}

async function findBrowser() {
  for (const candidate of browserCandidates()) {
    try {
      await access(candidate);
      return candidate;
    } catch {}
  }

  throw new Error(
    'Chrome/Chromium/Edge was not found. ' +
    'Set CHROMIUM or CHROME to the browser executable.'
  );
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

async function startStaticServer() {
  const server = createHttpServer(
    async (req, res) => {
      try {
        const url = new URL(
          req.url || '/',
          'http://127.0.0.1'
        );

        let pathname =
          decodeURIComponent(url.pathname);

        if (pathname === '/') {
          pathname = '/index.html';
        }

        const rel =
          pathname.replace(/^\/+/, '');

        const file =
          resolve(ROOT, rel);

        const check =
          relative(ROOT, file);

        if (
          check.startsWith('..') ||
          isAbsolute(check)
        ) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        const body =
          await readFile(file);

        res.writeHead(
          200,
          {
            'Content-Type':
              MIME[extname(file).toLowerCase()] ||
              'application/octet-stream',
            'Cache-Control': 'no-store'
          }
        );

        res.end(body);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    }
  );

  await new Promise(
    (resolvePromise, reject) => {
      server.once('error', reject);

      server.listen(
        0,
        '127.0.0.1',
        resolvePromise
      );
    }
  );

  const address = server.address();

  return {
    server,
    url:
      `http://127.0.0.1:${address.port}/`
  };
}

async function freePort() {
  const probe =
    createNetServer();

  await new Promise(
    (resolvePromise, reject) => {
      probe.once('error', reject);

      probe.listen(
        0,
        '127.0.0.1',
        resolvePromise
      );
    }
  );

  const port =
    probe.address().port;

  await new Promise(resolvePromise =>
    probe.close(resolvePromise)
  );

  return port;
}

async function waitForJson(
  url,
  attempts = 100
) {
  for (
    let i = 0;
    i < attempts;
    i++
  ) {
    try {
      const response =
        await fetch(url);

      if (response.ok) {
        return await response.json();
      }
    } catch {}

    await sleep(100);
  }

  throw new Error(
    `Timed out waiting for ${url}`
  );
}

const browser =
  await findBrowser();

const {
  server,
  url: siteURL
} = await startStaticServer();

const debugPort =
  await freePort();

const profile =
  await mkdtemp(
    join(
      tmpdir(),
      'rms-preview-v216-'
    )
  );

const child =
  spawn(
    browser,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-sync',
      '--no-first-run',
      '--no-default-browser-check',
      '--remote-debugging-address=127.0.0.1',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profile}`,
      'about:blank'
    ],
    {
      stdio: [
        'ignore',
        'ignore',
        'ignore'
      ]
    }
  );

let ws;
let nextId = 1;
const pending = new Map();

function cdp(
  method,
  params = {}
) {
  return new Promise(
    (resolvePromise, reject) => {
      const id = nextId++;

      const timer =
        setTimeout(
          () => {
            if (
              pending.has(id)
            ) {
              pending.delete(id);

              reject(
                new Error(
                  `CDP timeout: ${method}`
                )
              );
            }
          },
          10000
        );

      pending.set(
        id,
        {
          resolve: resolvePromise,
          reject,
          timer
        }
      );

      ws.send(
        JSON.stringify({
          id,
          method,
          params
        })
      );
    }
  );
}

async function evaluate(
  expression
) {
  const result =
    await cdp(
      'Runtime.evaluate',
      {
        expression,
        returnByValue: true,
        awaitPromise: true
      }
    );

  if (
    result.exceptionDetails
  ) {
    throw new Error(
      'Browser evaluation failed\n' +
      JSON.stringify(
        result.exceptionDetails,
        null,
        2
      )
    );
  }

  return result.result?.value;
}

async function waitFor(
  expression,
  label,
  attempts = 100
) {
  for (
    let i = 0;
    i < attempts;
    i++
  ) {
    try {
      if (
        await evaluate(expression)
      ) {
        return;
      }
    } catch {}

    await sleep(100);
  }

  throw new Error(
    `Timed out waiting for ${label}`
  );
}

function same(
  a,
  b
) {
  return JSON.stringify(a) ===
    JSON.stringify(b);
}

try {
  await waitForJson(
    `http://127.0.0.1:${debugPort}/json/version`
  );

  const targets =
    await waitForJson(
      `http://127.0.0.1:${debugPort}/json/list`
    );

  const pageTarget =
    targets.find(
      item =>
        item.type === 'page'
    );

  if (
    !pageTarget?.webSocketDebuggerUrl
  ) {
    throw new Error(
      'No browser page target was available.'
    );
  }

  ws =
    new WebSocket(
      pageTarget.webSocketDebuggerUrl
    );

  await new Promise(
    (resolvePromise, reject) => {
      ws.addEventListener(
        'open',
        resolvePromise,
        { once: true }
      );

      ws.addEventListener(
        'error',
        reject,
        { once: true }
      );
    }
  );

  ws.addEventListener(
    'message',
    event => {
      const msg =
        JSON.parse(event.data);

      if (
        !msg.id ||
        !pending.has(msg.id)
      ) {
        return;
      }

      const entry =
        pending.get(msg.id);

      pending.delete(msg.id);
      clearTimeout(entry.timer);

      if (msg.error) {
        entry.reject(
          new Error(
            JSON.stringify(
              msg.error
            )
          )
        );
      } else {
        entry.resolve(
          msg.result
        );
      }
    }
  );

  await cdp(
    'Runtime.enable'
  );

  await cdp(
    'Page.enable'
  );

  await cdp(
    'Page.navigate',
    {
      url: siteURL
    }
  );

  await waitFor(
    `document.readyState === "complete" &&
     !!window.RMSStudentFlowUI &&
     !!window.RMSStudentFlow &&
     !!document.getElementById("beginProject")`,
    'Research Methods Studio startup'
  );

  const created =
    await evaluate(`
      (() => {
        const name =
          document.getElementById(
            "projectName"
          );

        const context =
          document.getElementById(
            "projectContext"
          );

        const begin =
          document.getElementById(
            "beginProject"
          );

        if (
          !name ||
          !context ||
          !begin
        ) {
          return false;
        }

        name.value =
          "Preview immutability browser test";

        context.value =
          "Temporary browser QA project";

        begin.click();

        return true;
      })()
    `);

  if (!created) {
    throw new Error(
      'Could not create the browser QA project.'
    );
  }

  await waitFor(
    `!!document.querySelector(
      "#stageView .stage-card"
    )`,
    'initial stage render'
  );

  await evaluate(`
    (() => {
      const finish =
        document.getElementById(
          "finishOnboarding"
        );

      if (finish) {
        finish.click();
      }

      return true;
    })()
  `);

  await waitFor(
    `!!document.querySelector(
      "#stageView .stage-card"
    ) &&
    !document.getElementById(
      "studentOnboarding"
    )`,
    'onboarding completion'
  );

  await evaluate(`
    (() => {
      function findProject(
        value,
        depth = 0
      ) {
        if (
          !value ||
          typeof value !== "object" ||
          depth > 8
        ) {
          return null;
        }

        if (
          Object.prototype.hasOwnProperty.call(
            value,
            "currentStage"
          ) &&
          value.data &&
          value.ready &&
          value.flow
        ) {
          return value;
        }

        for (
          const child
          of Object.values(value)
        ) {
          const found =
            findProject(
              child,
              depth + 1
            );

          if (found) {
            return found;
          }
        }

        return null;
      }

      window.__rmsSavedProject =
        function() {
          for (
            let i = 0;
            i < localStorage.length;
            i++
          ) {
            const key =
              localStorage.key(i);

            const raw =
              localStorage.getItem(key);

            try {
              const parsed =
                JSON.parse(raw);

              const found =
                findProject(parsed);

              if (found) {
                return found;
              }
            } catch {}
          }

          throw new Error(
            "Saved project was not found in localStorage."
          );
        };

      window.__rmsStorageSnapshot =
        function() {
          const out = {};

          for (
            let i = 0;
            i < localStorage.length;
            i++
          ) {
            const key =
              localStorage.key(i);

            out[key] =
              localStorage.getItem(key);
          }

          return Object.fromEntries(
            Object.entries(out)
              .sort(
                ([a], [b]) =>
                  a.localeCompare(b)
              )
          );
        };

      window.__rmsStableProject =
        function(project) {
          const p =
            JSON.parse(
              JSON.stringify(project)
            );

          const flow =
            p.flow || {};

          return {
            currentStage:
              p.currentStage,

            ready:
              p.ready || {},

            data:
              p.data || {},

            sources:
              p.sources || [],

            reviews:
              p.reviews || [],

            schema:
              p.schema || [],

            searchLog:
              p.searchLog || [],

            litClaims:
              p.litClaims || [],

            litOutline:
              p.litOutline || [],

            methods:
              p.methods || {},

            analysis:
              p.analysis || {},

            writing:
              p.writing || {},

            transfer:
              p.transfer || {},

            competency:
              p.competency || {},

            journey:
              p.journey || {},

            pathway:
              p.pathway || {},

            rescue:
              p.rescue || {},

            aiHelper:
              p.aiHelper || {},

            flow: {
              ...flow,

              /*
                A normal re-render may update the
                timestamp of the already-current stage.
                The set of visited stages must remain
                unchanged.
              */
              visited:
                Object.keys(
                  flow.visited || {}
                ).sort()
            }
          };
        };

      return true;
    })()
  `);

  const baselineStorage =
    await evaluate(
      '__rmsStorageSnapshot()'
    );

  const baselineProject =
    await evaluate(
      '__rmsStableProject(__rmsSavedProject())'
    );

  if (
    Number(
      baselineProject.currentStage
    ) !== 1
  ) {
    throw new Error(
      `Expected Stage 1 baseline, got ${baselineProject.currentStage}.`
    );
  }

  const target =
    await evaluate(`
      (async () => {
        const current =
          Number(
            __rmsSavedProject()
              .currentStage
          );

        for (
          const stage
          of RMSCurriculum.stages
        ) {
          if (
            Number(stage.id) <=
            current
          ) {
            continue;
          }

          RMSStudentFlowUI
            .openFullStagePreview(
              stage.id
            );

          await new Promise(
            resolvePromise =>
              setTimeout(
                resolvePromise,
                20
              )
          );

          const sections =
            [
              ...document
                .querySelectorAll(
                  "#stageView " +
                  "[data-section-step]"
                )
            ];

          if (
            sections.length > 1
          ) {
            return {
              id:
                Number(stage.id),
              sections:
                sections.length
            };
          }

          RMSStudentFlowUI
            .exitStagePreview();

          await new Promise(
            resolvePromise =>
              setTimeout(
                resolvePromise,
                20
              )
          );
        }

        return null;
      })()
    `);

  if (!target) {
    throw new Error(
      'No future stage with multiple visible sections was found.'
    );
  }

  console.log(
    `PASS future stage ${target.id} selected for multi-section preview`
  );

  const previewInitial =
    await evaluate(`
      (() => {
        const card =
          document.querySelector(
            "#stageView .stage-card"
          );

        const enabledFields =
          card
            ?[
                ...card.querySelectorAll(
                  "input, textarea, select"
                )
              ].filter(
                control =>
                  !control.disabled
              ).length
            :999;

        return {
          preview:
            !!card?.classList.contains(
              "stage-preview-mode"
            ),

          banner:
            document
              .querySelector(
                ".stage-preview-banner"
              )
              ?.textContent || "",

          enabledFields,

          currentProgress:
            document
              .getElementById(
                "progressText"
              )
              ?.textContent || ""
        };
      })()
    `);

  if (!previewInitial.preview) {
    throw new Error(
      'Future stage did not render in preview mode.'
    );
  }

  if (
    !previewInitial.banner.includes(
      `Stage ${target.id}`
    )
  ) {
    throw new Error(
      'Preview banner does not identify the future stage.'
    );
  }

  if (
    previewInitial.enabledFields !== 0
  ) {
    throw new Error(
      'A preview form control remained editable.'
    );
  }

  if (
    !previewInitial.currentProgress.includes(
      'Stage 1 of 18'
    )
  ) {
    throw new Error(
      'Preview changed the visible real-stage progress.'
    );
  }

  console.log(
    'PASS future-stage form controls are read-only'
  );

  console.log(
    'PASS real progress remains on Stage 1 during preview'
  );

  await evaluate(`
    (() => {
      const button =
        document.querySelector(
          '#stageView [data-tab="work"]'
        );

      if (!button) {
        throw new Error(
          "Work tab was not found."
        );
      }

      button.click();

      return true;
    })()
  `);

  await waitFor(
    `document
      .querySelector(
        '#stageView [data-tab="work"]'
      )
      ?.classList.contains(
        "active"
      )`,
    'preview Work tab'
  );

  await evaluate(`
    (() => {
      const button =
        [
          ...document
            .querySelectorAll(
              "#stageView " +
              "[data-section-step]"
            )
        ].find(
          item =>
            Number(
              item.dataset.sectionStep
            ) > 0
        );

      if (!button) {
        throw new Error(
          "A later preview section was not found."
        );
      }

      button.click();

      return true;
    })()
  `);

  await waitFor(
    `[
      ...document.querySelectorAll(
        "#stageView [data-section-step]"
      )
    ].some(
      item =>
        Number(
          item.dataset.sectionStep
        ) > 0 &&
        item.classList.contains(
          "active"
        )
    )`,
    'later preview subsection'
  );

  console.log(
    'PASS future-stage subsection navigation works in preview'
  );

  await evaluate(`
    (() => {
      const button =
        document.querySelector(
          '#stageView [data-tab="check"]'
        );

      if (!button) {
        throw new Error(
          "Check tab was not found."
        );
      }

      button.click();

      return true;
    })()
  `);

  await waitFor(
    `document
      .querySelector(
        '#stageView [data-tab="check"]'
      )
      ?.classList.contains(
        "active"
      )`,
    'preview Check tab'
  );

  console.log(
    'PASS preview tab navigation reaches Check & revise'
  );

  await evaluate(`
    (() => {
      const routeButton =
        document.querySelector(
          "#stageView [data-route-open]"
        );

      if (!routeButton) {
        throw new Error(
          "Preview route button was not found."
        );
      }

      routeButton.click();

      return true;
    })()
  `);

  await waitFor(
    `!!document.getElementById(
      "routeBackdrop"
    )`,
    'research route from preview'
  );

  await evaluate(`
    (() => {
      const close =
        document.getElementById(
          "closeRoute"
        );

      if (!close) {
        throw new Error(
          "Route close button was not found."
        );
      }

      close.click();

      return true;
    })()
  `);

  await waitFor(
    `!document.getElementById(
      "routeBackdrop"
    )`,
    'route close'
  );

  console.log(
    'PASS research route opens and closes inside preview'
  );

  await evaluate(`
    (() => {
      const exit =
        document.getElementById(
          "exitStagePreview"
        );

      if (!exit) {
        throw new Error(
          "Preview exit button was not found."
        );
      }

      exit.click();

      return true;
    })()
  `);

  await waitFor(
    `!RMSStudentFlowUI.isPreviewing() &&
     !document.querySelector(
       ".stage-preview-mode"
     ) &&
     document
       .querySelector(
         "#stageView .stage-count"
       )
       ?.textContent
       .includes(
         "Stage 1 of 18"
       )`,
    'return to real current stage'
  );

  const storageAfterPreview =
    await evaluate(
      '__rmsStorageSnapshot()'
    );

  if (
    !same(
      baselineStorage,
      storageAfterPreview
    )
  ) {
    throw new Error(
      'Preview wrote to browser project storage before any legitimate save.'
    );
  }

  console.log(
    'PASS preview and exit perform no project-storage write'
  );

  /*
    Trigger an ordinary save after preview.

    Stage 1 is already on Learn, so this save should not
    introduce a semantic project change. If preview state
    leaked into the real in-memory project, this save will
    expose it in localStorage.
  */
  await evaluate(`
    (() => {
      const learn =
        document.querySelector(
          '#stageView [data-tab="learn"]'
        );

      if (!learn) {
        throw new Error(
          "Current-stage Learn tab was not found."
        );
      }

      learn.click();

      return true;
    })()
  `);

  await sleep(100);

  const finalProject =
    await evaluate(
      '__rmsStableProject(__rmsSavedProject())'
    );

  if (
    !same(
      baselineProject,
      finalProject
    )
  ) {
    const details =
      await evaluate(`
        (() => {
          const before =
            ${JSON.stringify(baselineProject)};

          const after =
            __rmsStableProject(
              __rmsSavedProject()
            );

          return {
            before,
            after
          };
        })()
      `);

    throw new Error(
      'Preview state leaked into the project after a later legitimate save.\n' +
      JSON.stringify(
        details,
        null,
        2
      )
    );
  }

  console.log(
    'PASS later legitimate save contains no preview-state leakage'
  );

  const futureLeak =
    await evaluate(`
      (() => {
        const p =
          __rmsSavedProject();

        const id =
          ${target.id};

        return {
          target:
            id,

          visited:
            Object.prototype
              .hasOwnProperty.call(
                p.flow?.visited || {},
                id
              ),

          ready:
            !!p.ready?.[id],

          tab:
            p.flow
              ?.activeTabByStage
              ?.[id] ?? null,

          section:
            p.flow
              ?.sectionByStage
              ?.[id] ?? null
        };
      })()
    `);

  const baselineVisited =
    baselineProject.flow
      ?.visited
      ?.includes(
        String(target.id)
      );

  const baselineTab =
    baselineProject.flow
      ?.activeTabByStage
      ?.[target.id] ?? null;

  const baselineSection =
    baselineProject.flow
      ?.sectionByStage
      ?.[target.id] ?? null;

  if (
    futureLeak.visited !==
      !!baselineVisited ||
    futureLeak.ready !==
      !!baselineProject.ready?.[
        target.id
      ] ||
    futureLeak.tab !==
      baselineTab ||
    futureLeak.section !==
      baselineSection
  ) {
    throw new Error(
      'Future-stage progress metadata changed during preview.\n' +
      JSON.stringify(
        futureLeak,
        null,
        2
      )
    );
  }

  console.log(
    'PASS future stage was not marked visited, ready, active, or section-progressed'
  );

  console.log();
  console.log(
    'V2.16 FUTURE-STAGE PREVIEW IMMUTABILITY: PASS'
  );
} finally {
  /*
    Chromium uses multiple processes. On Windows, killing only the
    process returned by spawn can leave child processes holding the
    temporary browser profile open. Terminate the whole process tree
    before removing the profile.
  */
  try {
    if (ws?.readyState === 1) {
      ws.close();
    }
  } catch {}

  try {
    if (
      process.platform === "win32" &&
      child.pid
    ) {
      await new Promise(resolvePromise => {
        const killer = spawn(
          "taskkill",
          [
            "/PID",
            String(child.pid),
            "/T",
            "/F"
          ],
          {
            stdio: "ignore"
          }
        );

        killer.once(
          "error",
          () => resolvePromise()
        );

        killer.once(
          "exit",
          () => resolvePromise()
        );
      });
    } else {
      child.kill("SIGTERM");
    }
  } catch {}

  try {
    await Promise.race([
      new Promise(resolvePromise => {
        if (child.exitCode !== null) {
          resolvePromise();
          return;
        }

        child.once(
          "exit",
          resolvePromise
        );
      }),
      sleep(5000)
    ]);
  } catch {}

  await new Promise(
    resolvePromise =>
      server.close(resolvePromise)
  );

  /*
    Windows may release Chromium database handles a short time after
    process termination. Retry the profile removal explicitly so EBUSY,
    EPERM, and ENOTEMPTY cannot turn a successful browser test into a
    false failure.
  */
  let cleanupError = null;

  for (
    let attempt = 0;
    attempt < 20;
    attempt++
  ) {
    try {
      await rm(
        profile,
        {
          recursive: true,
          force: true
        }
      );

      cleanupError = null;
      break;
    } catch (err) {
      cleanupError = err;

      if (
        ![
          "EBUSY",
          "EPERM",
          "ENOTEMPTY"
        ].includes(err?.code)
      ) {
        throw err;
      }

      await sleep(250);
    }
  }

  if (cleanupError) {
    /*
      The profile lives only under the operating-system temp directory.
      A delayed Windows/Chromium file-handle release must not convert a
      fully passed application regression into a false test failure.
    */
    console.warn(
      "WARN temporary Chromium QA profile could not be removed immediately:",
      profile,
      cleanupError.code || cleanupError.message
    );
  }
}
