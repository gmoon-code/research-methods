import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(
  new URL(
    "../assets/teacher-workspace-data.js",
    import.meta.url
  ),
  "utf8"
);

function loadModule() {
  const context = {
    window: {}
  };

  context.globalThis = context;

  vm.createContext(context);
  vm.runInContext(
    source,
    context,
    {
      filename:
        "teacher-workspace-data.js"
    }
  );

  return context.window
    .RMSTeacherWorkspaceData;
}

function minimalPacket(
  overrides = {}
) {
  return {
    packet_type:
      "rms_student_review",
    version:
      "1.7",
    project_id:
      "RMS-TEST-001",
    milestones: [],
    ...overrides
  };
}

function errorCodes(
  result
) {
  return Array.from(
    result.errors,
    error => error.code
  );
}

test(
  "exposes the fixed v1.7 packet contract",
  () => {
    const data = loadModule();

    assert.equal(
      data.PACKET_TYPE,
      "rms_student_review"
    );

    assert.equal(
      data.PACKET_VERSION,
      "1.7"
    );

    assert.equal(
      typeof data.validateStudentPacket,
      "function"
    );

    assert.equal(
      typeof data.normalizeStudentPacket,
      "function"
    );
  }
);

test(
  "accepts a minimal valid v1.7 packet",
  () => {
    const data = loadModule();
    const result =
      data.validateStudentPacket(
        minimalPacket()
      );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.errors.length,
      0
    );
  }
);

test(
  "rejects non-object packet content",
  () => {
    const data = loadModule();

    for (
      const value
      of [
        null,
        [],
        "packet",
        42,
        true
      ]
    ) {
      const result =
        data.validateStudentPacket(
          value
        );

      assert.equal(
        result.ok,
        false
      );

      assert.deepEqual(
        errorCodes(result),
        ["packet_not_object"]
      );
    }
  }
);

test(
  "rejects wrong packet type and version",
  () => {
    const data = loadModule();

    const result =
      data.validateStudentPacket(
        minimalPacket({
          packet_type:
            "rms_teacher_feedback",
          version:
            "9.9"
        })
      );

    const codes =
      errorCodes(result);

    assert.equal(
      result.ok,
      false
    );

    assert.ok(
      codes.includes(
        "wrong_packet_type"
      )
    );

    assert.ok(
      codes.includes(
        "wrong_packet_version"
      )
    );
  }
);

test(
  "rejects missing or unusable project IDs",
  () => {
    const data = loadModule();

    for (
      const value
      of [
        undefined,
        "",
        "   ",
        123
      ]
    ) {
      const packet =
        minimalPacket();

      if (
        value === undefined
      ) {
        delete packet.project_id;
      } else {
        packet.project_id =
          value;
      }

      const result =
        data.validateStudentPacket(
          packet
        );

      assert.ok(
        errorCodes(result).includes(
          "project_id_required"
        )
      );
    }
  }
);

test(
  "rejects absent or non-array milestones",
  () => {
    const data = loadModule();

    for (
      const value
      of [
        undefined,
        null,
        {},
        "M1"
      ]
    ) {
      const packet =
        minimalPacket();

      if (
        value === undefined
      ) {
        delete packet.milestones;
      } else {
        packet.milestones =
          value;
      }

      const result =
        data.validateStudentPacket(
          packet
        );

      assert.ok(
        errorCodes(result).includes(
          "milestones_required"
        )
      );
    }
  }
);

test(
  "enforces milestone structural rejection rules",
  () => {
    const data = loadModule();

    const cases = [
      [
        [null],
        "milestone_not_object"
      ],
      [
        [{}],
        "milestone_id_required"
      ],
      [
        [{
          id: "M1",
          state: 1
        }],
        "milestone_state_type"
      ],
      [
        [{
          id: "M1",
          blockers: "blocked"
        }],
        "milestone_blockers_type"
      ],
      [
        [{
          id: "M1",
          warnings: {}
        }],
        "milestone_warnings_type"
      ],
      [
        [{
          id: "M1",
          checkpoint: []
        }],
        "milestone_checkpoint_type"
      ]
    ];

    for (
      const [
        milestones,
        expectedCode
      ] of cases
    ) {
      const result =
        data.validateStudentPacket(
          minimalPacket({
            milestones
          })
        );

      assert.equal(
        result.ok,
        false
      );

      assert.ok(
        errorCodes(result).includes(
          expectedCode
        ),
        expectedCode
      );
    }
  }
);

test(
  "rejects malformed optional summary objects",
  () => {
    const data = loadModule();

    const cases = [
      [
        "methods",
        null,
        "methods_type"
      ],
      [
        "analysis",
        [],
        "analysis_type"
      ],
      [
        "writing",
        "paper",
        "writing_type"
      ],
      [
        "sources",
        7,
        "sources_type"
      ]
    ];

    for (
      const [
        field,
        value,
        expectedCode
      ] of cases
    ) {
      const packet =
        minimalPacket();

      packet[field] =
        value;

      const result =
        data.validateStudentPacket(
          packet
        );

      assert.equal(
        result.ok,
        false
      );

      assert.ok(
        errorCodes(result).includes(
          expectedCode
        ),
        expectedCode
      );
    }
  }
);

test(
  "normalization does not mutate the imported packet",
  () => {
    const data = loadModule();

    const packet =
      minimalPacket({
        student_alias:
          "Student A",
        stage_ready: {
          1: true
        },
        milestones: [
          {
            id: "M1",
            title:
              "Question Ready",
            blockers: [
              "Example blocker",
              99
            ],
            warnings: [
              "Example warning"
            ],
            checkpoint: {
              status:
                "submitted",
              conditions: [
                "Revise wording",
                false
              ]
            }
          }
        ],
        methods: {
          available: true,
          locked: false
        },
        sources: {
          total: 4,
          themes: [
            "Theme A",
            123
          ]
        }
      });

    const before =
      JSON.stringify(packet);

    const result =
      data.normalizeStudentPacket(
        packet
      );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      JSON.stringify(packet),
      before
    );

    assert.notEqual(
      result.packet,
      packet
    );

    assert.notEqual(
      result.packet.milestones,
      packet.milestones
    );
  }
);

test(
  "missing optional values remain neutral",
  () => {
    const data = loadModule();

    const result =
      data.normalizeStudentPacket(
        minimalPacket()
      );

    assert.equal(
      result.ok,
      true
    );

    const packet =
      result.packet;

    assert.equal(
      packet.student_alias,
      ""
    );

    assert.equal(
      packet.course_section,
      ""
    );

    assert.equal(
      packet.sources.total,
      null
    );

    assert.equal(
      packet.sources.included,
      null
    );

    assert.equal(
      packet.methods.available,
      null
    );

    assert.equal(
      packet.methods.locked,
      null
    );

    assert.equal(
      packet.methods.score,
      null
    );

    assert.equal(
      packet.analysis.imported_rows,
      null
    );

    assert.equal(
      packet.analysis.stored_runs,
      null
    );

    assert.equal(
      packet.writing.paper_audit,
      null
    );

    assert.equal(
      packet.teacher_feedback.length,
      0
    );
  }
);

test(
  "explicit false boolean evidence remains false",
  () => {
    const data = loadModule();

    const result =
      data.normalizeStudentPacket(
        minimalPacket({
          methods: {
            available: false,
            locked: false
          }
        })
      );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.packet.methods
        .available,
      false
    );

    assert.equal(
      result.packet.methods
        .locked,
      false
    );
  }
);

test(
  "normalization filters unsupported list values without inventing evidence",
  () => {
    const data = loadModule();

    const result =
      data.normalizeStudentPacket(
        minimalPacket({
          milestones: [
            {
              id: "M1",
              blockers: [
                "Real blocker",
                5,
                null
              ],
              warnings: [
                "Real warning",
                {}
              ],
              checkpoint: {
                conditions: [
                  "Condition A",
                  true
                ]
              }
            }
          ],
          sources: {
            themes: [
              "Theme A",
              17
            ]
          }
        })
      );

    const milestone =
      result.packet
        .milestones[0];

    assert.deepEqual(
      Array.from(
        milestone.blockers
      ),
      ["Real blocker"]
    );

    assert.deepEqual(
      Array.from(
        milestone.warnings
      ),
      ["Real warning"]
    );

    assert.deepEqual(
      Array.from(
        milestone.checkpoint
          .conditions
      ),
      ["Condition A"]
    );

    assert.deepEqual(
      Array.from(
        result.packet.sources
          .themes
      ),
      ["Theme A"]
    );
  }
);

test(
  "untrusted text remains inert data in the data module",
  () => {
    const data = loadModule();

    const dangerous =
      '<img src=x onerror="window.pwned=true">';

    const result =
      data.normalizeStudentPacket(
        minimalPacket({
          student_alias:
            dangerous,
          milestones: [
            {
              id: "M1",
              blockers: [
                dangerous
              ]
            }
          ]
        })
      );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.packet.student_alias,
      dangerous
    );

    assert.equal(
      result.packet
        .milestones[0]
        .blockers[0],
      dangerous
    );
  }
);

test(
  "normalization excludes competency snapshot and unexported full-work fields",
  () => {
    const data = loadModule();

    const result =
      data.normalizeStudentPacket(
        minimalPacket({
          competency_snapshot: {
            score: 999
          },
          rawData: [
            {
              private:
                "raw"
            }
          ],
          full_paper_text:
            "private manuscript",
          full_source_notes:
            "private notes",
          research_chat_transcript:
            "private transcript"
        })
      );

    assert.equal(
      result.ok,
      true
    );

    const normalized =
      result.packet;

    assert.equal(
      "competency_snapshot"
        in normalized,
      false
    );

    assert.equal(
      "rawData"
        in normalized,
      false
    );

    assert.equal(
      "full_paper_text"
        in normalized,
      false
    );

    assert.equal(
      "full_source_notes"
        in normalized,
      false
    );

    assert.equal(
      "research_chat_transcript"
        in normalized,
      false
    );
  }
);

test(
  "returned normalized structures are frozen",
  () => {
    const data = loadModule();

    const result =
      data.normalizeStudentPacket(
        minimalPacket({
          milestones: [
            {
              id: "M1"
            }
          ]
        })
      );

    assert.equal(
      Object.isFrozen(
        result.packet
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        result.packet.milestones
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        result.packet
          .milestones[0]
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        result.packet.methods
      ),
      true
    );
  }
);
