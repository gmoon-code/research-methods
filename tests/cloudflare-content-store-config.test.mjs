import test from "node:test";
import assert from "node:assert/strict";

import {
  CONTENT_BINDING,
  baseConfigIsAccountNeutral,
  chooseExistingNamespace,
  contentBindingId,
  expectedNamespaceTitles,
  parseNamespaceListOutput,
  validNamespaceId,
  withContentBinding
} from "../scripts/cloudflare-content-store-config.mjs";

const ID_A =
  "a".repeat(32);

const ID_B =
  "b".repeat(32);

test(
  "content KV namespace IDs use the expected Cloudflare shape",
  () => {
    assert.equal(
      validNamespaceId(
        ID_A
      ),
      true
    );

    assert.equal(
      validNamespaceId(
        "abc"
      ),
      false
    );

    assert.equal(
      validNamespaceId(
        "g".repeat(32)
      ),
      false
    );
  }
);

test(
  "namespace list parser tolerates Wrangler text around the JSON array",
  () => {
    const parsed =
      parseNamespaceListOutput(
        `warning line\n[
  {"id":"${ID_A}","title":"rms-research-chat-free-RMS_CONTENT_STORE"},
  {"id":"not-valid","title":"ignored"}
]\ntrailing text`
      );

    assert.deepEqual(
      parsed,
      [
        {
          id: ID_A,
          title:
            "rms-research-chat-free-RMS_CONTENT_STORE"
        }
      ]
    );
  }
);

test(
  "namespace list parser rejects output without a JSON array",
  () => {
    assert.throws(
      () =>
        parseNamespaceListOutput(
          "no json here"
        )
    );
  }
);

test(
  "expected namespace titles cover direct and Worker-prefixed Wrangler names",
  () => {
    assert.deepEqual(
      expectedNamespaceTitles(
        "rms-research-chat-free"
      ),
      [
        CONTENT_BINDING,
        "rms-research-chat-free-RMS_CONTENT_STORE"
      ]
    );
  }
);

test(
  "existing namespace selection accepts one exact matching namespace",
  () => {
    assert.deepEqual(
      chooseExistingNamespace(
        [
          {
            id: ID_A,
            title:
              "other"
          },
          {
            id: ID_B,
            title:
              "rms-research-chat-free-RMS_CONTENT_STORE"
          }
        ],
        "rms-research-chat-free"
      ),
      {
        id: ID_B,
        title:
          "rms-research-chat-free-RMS_CONTENT_STORE"
      }
    );

    assert.equal(
      chooseExistingNamespace(
        [
          {
            id: ID_A,
            title:
              "unrelated"
          }
        ],
        "rms-research-chat-free"
      ),
      null
    );
  }
);

test(
  "duplicate matching namespaces fail closed",
  () => {
    assert.throws(
      () =>
        chooseExistingNamespace(
          [
            {
              id: ID_A,
              title:
                CONTENT_BINDING
            },
            {
              id: ID_B,
              title:
                "rms-research-chat-free-RMS_CONTENT_STORE"
            }
          ],
          "rms-research-chat-free"
        ),
      /Multiple matching/
    );
  }
);

test(
  "temporary deployment config adds the content binding without mutating base config",
  () => {
    const base = {
      name:
        "rms-research-chat-free",
      kv_namespaces: [
        {
          binding:
            "OTHER",
          id: ID_B
        }
      ]
    };

    assert.equal(
      baseConfigIsAccountNeutral(
        base
      ),
      true
    );

    const next =
      withContentBinding(
        base,
        ID_A
      );

    assert.equal(
      baseConfigIsAccountNeutral(
        base
      ),
      true
    );

    assert.equal(
      contentBindingId(
        next
      ),
      ID_A
    );

    assert.deepEqual(
      next.kv_namespaces,
      [
        {
          binding:
            "OTHER",
          id: ID_B
        },
        {
          binding:
            CONTENT_BINDING,
          id: ID_A
        }
      ]
    );
  }
);

test(
  "content binding reader rejects duplicate or malformed declarations",
  () => {
    assert.equal(
      contentBindingId({}),
      ""
    );

    assert.throws(
      () =>
        contentBindingId({
          kv_namespaces: [
            {
              binding:
                CONTENT_BINDING,
              id: "bad"
            }
          ]
        })
    );

    assert.throws(
      () =>
        contentBindingId({
          kv_namespaces: [
            {
              binding:
                CONTENT_BINDING,
              id: ID_A
            },
            {
              binding:
                CONTENT_BINDING,
              id: ID_A
            }
          ]
        })
    );
  }
);
