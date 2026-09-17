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


test(
  "upsert adds a normalized packet without mutating the existing collection",
  () => {
    const data = loadModule();

    const existing = [];
    const raw =
      minimalPacket({
        student_alias:
          "Student A"
      });

    const rawBefore =
      JSON.stringify(raw);

    const result =
      data.upsertStudentPacket(
        existing,
        raw
      );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.replaced,
      false
    );

    assert.equal(
      result.index,
      0
    );

    assert.equal(
      result.packets.length,
      1
    );

    assert.equal(
      result.packets[0]
        .student_alias,
      "Student A"
    );

    assert.equal(
      existing.length,
      0
    );

    assert.equal(
      JSON.stringify(raw),
      rawBefore
    );

    assert.equal(
      Object.isFrozen(
        result.packets
      ),
      true
    );
  }
);

test(
  "duplicate project ID replaces the prior whole packet snapshot",
  () => {
    const data = loadModule();

    const first =
      data.upsertStudentPacket(
        [],
        minimalPacket({
          project_name:
            "Old snapshot",
          methods: {
            locked: true
          }
        })
      );

    const second =
      data.upsertStudentPacket(
        first.packets,
        minimalPacket({
          project_name:
            "New snapshot"
        })
      );

    assert.equal(
      second.ok,
      true
    );

    assert.equal(
      second.replaced,
      true
    );

    assert.equal(
      second.packets.length,
      1
    );

    assert.equal(
      second.packets[0]
        .project_name,
      "New snapshot"
    );

    assert.equal(
      second.packets[0]
        .methods.locked,
      null
    );
  }
);

test(
  "rejected upsert candidate does not enter the collection",
  () => {
    const data = loadModule();

    const first =
      data.upsertStudentPacket(
        [],
        minimalPacket()
      );

    const rejected =
      data.upsertStudentPacket(
        first.packets,
        {
          packet_type:
            "wrong",
          version:
            "1.7",
          project_id:
            "RMS-BAD",
          milestones: []
        }
      );

    assert.equal(
      rejected.ok,
      false
    );

    assert.equal(
      rejected.replaced,
      false
    );

    assert.equal(
      rejected.packets.length,
      1
    );

    assert.equal(
      rejected.packets[0]
        .project_id,
      "RMS-TEST-001"
    );
  }
);

test(
  "Overview derives exact checkpoint and project counts from explicit packet evidence",
  () => {
    const data = loadModule();

    const packets = [
      minimalPacket({
        project_id:
          "RMS-A",
        milestones: [
          {
            id: "M1",
            state:
              "awaiting_teacher"
          },
          {
            id: "M3",
            state:
              "awaiting_teacher",
            blockers: [
              "Protocol is not locked."
            ]
          }
        ],
        methods: {
          ethicsStatus:
            "teacher_review",
          locked: true
        },
        analysis: {
          stored_runs: 2
        }
      }),
      minimalPacket({
        project_id:
          "RMS-B",
        milestones: [
          {
            id: "M5",
            state:
              "revision_requested"
          }
        ],
        methods: {
          ethicsStatus:
            "do_not_facilitate",
          locked: false
        },
        analysis: {
          stored_runs: 0
        }
      }),
      minimalPacket({
        project_id:
          "RMS-C",
        milestones: [
          {
            id: "M2",
            state:
              "complete"
          }
        ]
      })
    ];

    const overview =
      data.deriveOverview(
        packets
      );

    assert.deepEqual(
      {
        importedProjects:
          overview.importedProjects,
        awaitingReviewCheckpoints:
          overview.awaitingReviewCheckpoints,
        revisionRequestCheckpoints:
          overview.revisionRequestCheckpoints,
        projectsWithBlockers:
          overview.projectsWithBlockers,
        ethicsReviewProjects:
          overview.ethicsReviewProjects,
        doNotFacilitateProjects:
          overview.doNotFacilitateProjects,
        lockedProtocols:
          overview.lockedProtocols,
        projectsWithStoredAnalysis:
          overview.projectsWithStoredAnalysis
      },
      {
        importedProjects: 3,
        awaitingReviewCheckpoints: 2,
        revisionRequestCheckpoints: 1,
        projectsWithBlockers: 1,
        ethicsReviewProjects: 1,
        doNotFacilitateProjects: 1,
        lockedProtocols: 1,
        projectsWithStoredAnalysis: 1
      }
    );
  }
);

test(
  "Overview deduplicates repeated project IDs and uses the most recent whole snapshot",
  () => {
    const data = loadModule();

    const overview =
      data.deriveOverview([
        minimalPacket({
          project_id:
            "RMS-SAME",
          milestones: [
            {
              id: "M1",
              state:
                "awaiting_teacher"
            }
          ],
          methods: {
            locked: true
          }
        }),
        minimalPacket({
          project_id:
            "RMS-SAME",
          milestones: [
            {
              id: "M1",
              state:
                "approved"
            }
          ]
        })
      ]);

    assert.equal(
      overview.importedProjects,
      1
    );

    assert.equal(
      overview
        .awaitingReviewCheckpoints,
      0
    );

    assert.equal(
      overview.lockedProtocols,
      0
    );
  }
);

test(
  "Review Queue permits multiple simultaneous explicit flags",
  () => {
    const data = loadModule();

    const rows =
      data.deriveReviewQueue([
        minimalPacket({
          project_id:
            "RMS-MULTI",
          milestones: [
            {
              id: "M1",
              state:
                "awaiting_teacher",
              blockers: [
                "Question needs revision."
              ]
            },
            {
              id: "M3",
              state:
                "revision_requested"
            }
          ],
          methods: {
            ethicsStatus:
              "teacher_review"
          }
        })
      ]);

    assert.equal(
      rows.length,
      1
    );

    assert.deepEqual(
      Array.from(
        rows[0].flags,
        flag => flag.id
      ),
      [
        "awaiting_review",
        "revision_requested",
        "ethics_review",
        "blocked"
      ]
    );

    assert.ok(
      rows[0].flags.every(
        flag =>
          typeof flag.reason ===
            "string" &&
          flag.reason.length > 0
      )
    );
  }
);

test(
  "do-not-facilitate remains a software packet flag with separate judgment language",
  () => {
    const data = loadModule();

    const row =
      data.deriveReviewQueue([
        minimalPacket({
          project_id:
            "RMS-STOP",
          methods: {
            ethicsStatus:
              "do_not_facilitate"
          }
        })
      ])[0];

    const flag =
      row.flags.find(
        item =>
          item.id ===
          "do_not_facilitate"
      );

    assert.ok(flag);

    assert.match(
      flag.reason,
      /judgment remains separate/i
    );
  }
);

test(
  "no-immediate-action appears only when no other T2 queue flag applies",
  () => {
    const data = loadModule();

    const neutral =
      data.deriveReviewQueue([
        minimalPacket({
          project_id:
            "RMS-NEUTRAL"
        })
      ])[0];

    assert.deepEqual(
      Array.from(
        neutral.flags,
        flag => flag.id
      ),
      [
        "no_immediate_action"
      ]
    );

    const blocked =
      data.deriveReviewQueue([
        minimalPacket({
          project_id:
            "RMS-BLOCKED",
          milestones: [
            {
              id: "M3",
              blockers: [
                "Example blocker"
              ]
            }
          ]
        })
      ])[0];

    assert.equal(
      blocked.flags.some(
        flag =>
          flag.id ===
          "no_immediate_action"
      ),
      false
    );
  }
);

test(
  "Review Queue uses deterministic non-performance ordering",
  () => {
    const data = loadModule();

    const rows =
      data.deriveReviewQueue([
        minimalPacket({
          project_id:
            "RMS-D",
          course_section:
            "B",
          student_alias:
            "Aaron"
        }),
        minimalPacket({
          project_id:
            "RMS-C",
          course_section:
            "A",
          student_alias:
            "",
          project_name:
            "Project C"
        }),
        minimalPacket({
          project_id:
            "RMS-B",
          course_section:
            "A",
          student_alias:
            "Zoe"
        }),
        minimalPacket({
          project_id:
            "RMS-A",
          course_section:
            "A",
          student_alias:
            "Amy"
        })
      ]);

    assert.deepEqual(
      Array.from(
        rows,
        row => row.project_id
      ),
      [
        "RMS-A",
        "RMS-B",
        "RMS-C",
        "RMS-D"
      ]
    );
  }
);

test(
  "missing optional diagnostics do not create Overview counts or queue warnings",
  () => {
    const data = loadModule();

    const packet =
      minimalPacket({
        project_id:
          "RMS-MISSING"
      });

    const overview =
      data.deriveOverview([
        packet
      ]);

    assert.equal(
      overview.lockedProtocols,
      0
    );

    assert.equal(
      overview
        .projectsWithStoredAnalysis,
      0
    );

    assert.equal(
      overview.ethicsReviewProjects,
      0
    );

    assert.equal(
      overview
        .doNotFacilitateProjects,
      0
    );

    const row =
      data.deriveReviewQueue([
        packet
      ])[0];

    assert.deepEqual(
      Array.from(
        row.flags,
        flag => flag.id
      ),
      [
        "no_immediate_action"
      ]
    );
  }
);


test(
  "rejected packets do not contribute to Overview counts",
  () => {
    const data = loadModule();

    const valid =
      minimalPacket({
        project_id:
          "RMS-VALID",
        milestones: [
          {
            id: "M1",
            state:
              "awaiting_teacher"
          }
        ],
        methods: {
          locked: true
        }
      });

    const invalid = {
      packet_type:
        "wrong_packet_type",
      version:
        "1.7",
      project_id:
        "RMS-INVALID",
      milestones: [
        {
          id: "M1",
          state:
            "awaiting_teacher"
        }
      ],
      methods: {
        locked: true,
        ethicsStatus:
          "teacher_review"
      },
      analysis: {
        stored_runs: 9
      }
    };

    const overview =
      data.deriveOverview([
        valid,
        invalid
      ]);

    assert.equal(
      overview.importedProjects,
      1
    );

    assert.equal(
      overview
        .awaitingReviewCheckpoints,
      1
    );

    assert.equal(
      overview.lockedProtocols,
      1
    );

    assert.equal(
      overview.ethicsReviewProjects,
      0
    );

    assert.equal(
      overview
        .projectsWithStoredAnalysis,
      0
    );
  }
);

test(
  "rejected packets do not enter Review Queue results",
  () => {
    const data = loadModule();

    const valid =
      minimalPacket({
        project_id:
          "RMS-VALID",
        student_alias:
          "Valid Student"
      });

    const invalid = {
      packet_type:
        "rms_student_review",
      version:
        "9.9",
      project_id:
        "RMS-INVALID",
      milestones: [
        {
          id: "M1",
          state:
            "awaiting_teacher"
        }
      ]
    };

    const rows =
      data.deriveReviewQueue([
        invalid,
        valid
      ]);

    assert.equal(
      rows.length,
      1
    );

    assert.equal(
      rows[0].project_id,
      "RMS-VALID"
    );

    assert.equal(
      rows.some(
        row =>
          row.project_id ===
          "RMS-INVALID"
      ),
      false
    );
  }
);


test(
  "Student Inspector rejects an invalid packet",
  () => {
    const data = loadModule();

    const result =
      data.deriveStudentInspector({
        packet_type:
          "wrong",
        version:
          "1.7",
        project_id:
          "RMS-BAD",
        milestones: []
      });

    assert.equal(
      result.ok,
      false
    );

    assert.equal(
      result.inspector,
      null
    );

    assert.ok(
      result.errors.length > 0
    );
  }
);

test(
  "Student Inspector exposes only the contract-authorized top-level sections",
  () => {
    const data = loadModule();

    const result =
      data.deriveStudentInspector(
        minimalPacket({
          student_alias:
            "Student A",
          project_name:
            "Project A"
        })
      );

    assert.equal(
      result.ok,
      true
    );

    assert.deepEqual(
      Object.keys(
        result.inspector
      ).sort(),
      [
        "analysis",
        "header",
        "methods",
        "milestones",
        "notices",
        "research",
        "sources",
        "stage_progress",
        "teacher_feedback",
        "writing"
      ].sort()
    );

    assert.equal(
      "packet"
        in result.inspector,
      false
    );
  }
);

test(
  "Student Inspector header and research model use only permitted review-packet fields",
  () => {
    const data = loadModule();

    const result =
      data.deriveStudentInspector(
        minimalPacket({
          exported_at:
            "2026-09-16T01:00:00.000Z",
          student_alias:
            "Alias 7",
          course_section:
            "AP Bio A",
          project_name:
            "Seed Study",
          context:
            "Classroom context",
          topic:
            "Seed growth",
          research_question:
            "How does X relate to Y?",
          question_type:
            "Correlational",
          design:
            "Observational"
        })
      );

    const inspector =
      result.inspector;

    assert.equal(
      inspector.header
        .student_alias,
      "Alias 7"
    );

    assert.equal(
      inspector.header
        .project_id,
      "RMS-TEST-001"
    );

    assert.equal(
      inspector.header
        .course_section,
      "AP Bio A"
    );

    assert.equal(
      inspector.header
        .project_name,
      "Seed Study"
    );

    assert.equal(
      inspector.header
        .exported_at,
      "2026-09-16T01:00:00.000Z"
    );

    assert.equal(
      inspector.research
        .research_question,
      "How does X relate to Y?"
    );

    assert.equal(
      inspector.research.design,
      "Observational"
    );
  }
);

test(
  "Student Inspector always derives an 18-stage read-only progress model",
  () => {
    const data = loadModule();

    const result =
      data.deriveStudentInspector(
        minimalPacket({
          stage_ready: {
            1: true,
            3: true,
            18: true
          }
        })
      );

    const progress =
      result.inspector
        .stage_progress;

    assert.equal(
      progress.total_stages,
      18
    );

    assert.equal(
      progress.stages.length,
      18
    );

    assert.equal(
      progress.ready_count,
      3
    );

    assert.deepEqual(
      Array.from(
        progress.stages,
        item => item.stage
      ),
      Array.from(
        {
          length: 18
        },
        (_, index) =>
          index + 1
      )
    );

    assert.equal(
      progress.stages[0]
        .status,
      "ready"
    );

    assert.equal(
      progress.stages[1]
        .status,
      "not_marked_ready"
    );

    assert.match(
      progress.interpretation,
      /not a grade/i
    );
  }
);

test(
  "Student Inspector carries milestone checkpoint evidence without editing it",
  () => {
    const data = loadModule();

    const original =
      minimalPacket({
        milestones: [
          {
            id: "M3",
            title:
              "Method Approved",
            state:
              "revision_requested",
            blockers: [
              "Protocol is not locked."
            ],
            warnings: [
              "Teacher review required."
            ],
            checkpoint: {
              status:
                "revise",
              requestedAt:
                "2026-09-15T01:00:00.000Z",
              reviewedAt:
                "2026-09-16T01:00:00.000Z",
              teacher:
                "Teacher",
              comment:
                "Revise sampling.",
              conditions: [
                "Clarify sample."
              ]
            }
          }
        ]
      });

    const before =
      JSON.stringify(original);

    const result =
      data.deriveStudentInspector(
        original
      );

    const milestone =
      result.inspector
        .milestones[0];

    assert.equal(
      milestone.id,
      "M3"
    );

    assert.equal(
      milestone.state,
      "revision_requested"
    );

    assert.equal(
      milestone.checkpoint
        .comment,
      "Revise sampling."
    );

    assert.deepEqual(
      Array.from(
        milestone.checkpoint
          .conditions
      ),
      [
        "Clarify sample."
      ]
    );

    assert.equal(
      JSON.stringify(original),
      before
    );
  }
);

test(
  "Student Inspector keeps missing optional evidence neutral",
  () => {
    const data = loadModule();

    const result =
      data.deriveStudentInspector(
        minimalPacket()
      );

    const inspector =
      result.inspector;

    assert.equal(
      inspector.sources.total,
      null
    );

    assert.equal(
      inspector.methods
        .available,
      null
    );

    assert.equal(
      inspector.methods.locked,
      null
    );

    assert.equal(
      inspector.analysis
        .imported_rows,
      null
    );

    assert.equal(
      inspector.analysis
        .stored_runs,
      null
    );

    assert.equal(
      inspector.writing
        .paper_audit,
      null
    );

    assert.match(
      inspector.notices
        .missing_data,
      /not provided/i
    );
  }
);

test(
  "Student Inspector includes explicit privacy and interpretation notices",
  () => {
    const data = loadModule();

    const inspector =
      data.deriveStudentInspector(
        minimalPacket()
      ).inspector;

    assert.match(
      inspector.notices.scope,
      /does not contain all student work/i
    );

    assert.match(
      inspector.sources.notice,
      /source records/i
    );

    assert.match(
      inspector.sources.notice,
      /source notes/i
    );

    assert.match(
      inspector.analysis.notice,
      /raw dataset rows are not included/i
    );

    assert.match(
      inspector.writing.notice,
      /full paper text is not included/i
    );

    assert.equal(
      inspector.methods.kind,
      "packet_diagnostic"
    );

    assert.match(
      inspector.methods.notice,
      /separate from teacher judgment/i
    );
  }
);

test(
  "Student Inspector teacher feedback history is read-only and frozen",
  () => {
    const data = loadModule();

    const inspector =
      data.deriveStudentInspector(
        minimalPacket({
          teacher_feedback: [
            {
              milestone:
                "M1",
              comment:
                "Clarify the question.",
              createdAt:
                "2026-09-16T01:00:00.000Z"
            }
          ]
        })
      ).inspector;

    assert.equal(
      inspector.teacher_feedback
        .read_only,
      true
    );

    assert.equal(
      inspector.teacher_feedback
        .items.length,
      1
    );

    assert.equal(
      inspector.teacher_feedback
        .items[0].comment,
      "Clarify the question."
    );

    assert.equal(
      Object.isFrozen(
        inspector.teacher_feedback
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        inspector.teacher_feedback
          .items
      ),
      true
    );
  }
);

test(
  "Student Inspector does not expose competency or omitted full-work fields",
  () => {
    const data = loadModule();

    const inspector =
      data.deriveStudentInspector(
        minimalPacket({
          competency_snapshot: {
            score: 100
          },
          rawData: [
            {
              private:
                "raw"
            }
          ],
          full_paper_text:
            "private paper",
          full_source_text:
            "private source",
          full_source_notes:
            "private notes",
          research_chat_transcript:
            "private chat"
        })
      ).inspector;

    const serialized =
      JSON.stringify(
        inspector
      );

    for (
      const value
      of [
        "competency_snapshot",
        "private raw",
        "private paper",
        "private source",
        "private notes",
        "private chat"
      ]
    ) {
      assert.equal(
        serialized.includes(value),
        false,
        value
      );
    }
  }
);

test(
  "Student Inspector model and nested sections are frozen",
  () => {
    const data = loadModule();

    const inspector =
      data.deriveStudentInspector(
        minimalPacket({
          milestones: [
            {
              id: "M1"
            }
          ]
        })
      ).inspector;

    for (
      const value
      of [
        inspector,
        inspector.header,
        inspector.research,
        inspector.stage_progress,
        inspector.stage_progress
          .stages,
        inspector.milestones,
        inspector.milestones[0],
        inspector.sources,
        inspector.methods,
        inspector.analysis,
        inspector.writing,
        inspector.teacher_feedback,
        inspector.notices
      ]
    ) {
      assert.equal(
        Object.isFrozen(value),
        true
      );
    }
  }
);

function reviewablePacket(
  overrides = {}
) {
  return minimalPacket({
    exported_at:
      "2026-09-16T00:00:00.000Z",
    student_alias:
      "Student One",
    course_section:
      "AP Biology",
    project_name:
      "Reflection Study",
    milestones: [
      {
        id:
          "M1",
        title:
          "Question checkpoint",
        state:
          "awaiting_teacher",
        blockers: [
          "Imported blocker must not become a teacher condition."
        ],
        warnings: [
          "Imported warning must not become teacher feedback."
        ],
        checkpoint: {
          status:
            "awaiting_teacher",
          requestedAt:
            "2026-09-15T00:00:00.000Z",
          reviewedAt:
            "",
          teacher:
            "",
          comment:
            "",
          conditions:
            []
        }
      },
      {
        id:
          "M3",
        title:
          "Methods checkpoint",
        state:
          "student_ready",
        blockers:
          [],
        warnings:
          [],
        checkpoint: {
          status:
            "not_requested",
          requestedAt:
            "",
          reviewedAt:
            "",
          teacher:
            "",
          comment:
            "",
          conditions:
            []
        }
      }
    ],
    teacher_feedback: [
      {
        milestone:
          "M1",
        stage:
          "Stage 2",
        comment:
          "Existing history must remain read-only.",
        createdAt:
          "2026-09-14T00:00:00.000Z"
      }
    ],
    ...overrides
  });
}

test(
  "T3 exposes the existing v1.7 teacher feedback contract",
  () => {
    const data =
      loadModule();

    assert.equal(
      data.FEEDBACK_PACKET_TYPE,
      "rms_teacher_feedback"
    );

    assert.equal(
      data.FEEDBACK_PACKET_VERSION,
      "1.7"
    );

    assert.deepEqual(
      Array.from(
        data.REVIEW_DECISION_STATUSES
      ),
      [
        "approved",
        "revision_requested"
      ]
    );

    for (
      const name
      of [
        "createTeacherReviewDraft",
        "validateTeacherReviewDraft",
        "setTeacherDisplayName",
        "upsertCheckpointDecision",
        "upsertTeacherFeedback",
        "hasExportableTeacherReview",
        "buildTeacherFeedbackPacket"
      ]
    ) {
      assert.equal(
        typeof data[name],
        "function",
        name
      );
    }
  }
);

test(
  "T3 creates an empty frozen review draft for one valid project",
  () => {
    const data =
      loadModule();

    const packet =
      reviewablePacket();

    const before =
      JSON.stringify(
        packet
      );

    const result =
      data.createTeacherReviewDraft(
        packet
      );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.draft.project_id,
      packet.project_id
    );

    assert.equal(
      result.draft.teacher,
      ""
    );

    assert.equal(
      result.draft.checkpoints.length,
      0
    );

    assert.equal(
      result.draft.feedback.length,
      0
    );

    assert.equal(
      Object.isFrozen(
        result.draft
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        result.draft.checkpoints
      ),
      true
    );

    assert.equal(
      JSON.stringify(
        packet
      ),
      before
    );
  }
);

test(
  "T3 refuses to create a review draft from an invalid student packet",
  () => {
    const data =
      loadModule();

    const result =
      data.createTeacherReviewDraft({
        packet_type:
          "wrong",
        version:
          "1.7",
        project_id:
          "RMS-TEST-001",
        milestones:
          []
      });

    assert.equal(
      result.ok,
      false
    );

    assert.equal(
      result.draft,
      null
    );
  }
);

test(
  "T3 sets teacher display name without mutating the prior draft",
  () => {
    const data =
      loadModule();

    const packet =
      reviewablePacket();

    const first =
      data.createTeacherReviewDraft(
        packet
      ).draft;

    const result =
      data.setTeacherDisplayName(
        packet,
        first,
        "Ms. Moon"
      );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      first.teacher,
      ""
    );

    assert.equal(
      result.draft.teacher,
      "Ms. Moon"
    );

    assert.notEqual(
      result.draft,
      first
    );
  }
);

test(
  "T3 accepts explicit approved and revision_requested decisions and replaces by checkpoint ID",
  () => {
    const data =
      loadModule();

    const packet =
      reviewablePacket();

    let draft =
      data.createTeacherReviewDraft(
        packet
      ).draft;

    draft =
      data.upsertCheckpointDecision(
        packet,
        draft,
        {
          id:
            "M1",
          status:
            "approved",
          comment:
            "Approved after review.",
          conditions:
            []
        }
      ).draft;

    assert.equal(
      draft.checkpoints.length,
      1
    );

    assert.equal(
      draft.checkpoints[0].status,
      "approved"
    );

    draft =
      data.upsertCheckpointDecision(
        packet,
        draft,
        {
          id:
            "M1",
          status:
            "revision_requested",
          comment:
            "Please revise.",
          conditions: [
            "Clarify the sampling plan."
          ]
        }
      ).draft;

    assert.equal(
      draft.checkpoints.length,
      1
    );

    assert.equal(
      draft.checkpoints[0].status,
      "revision_requested"
    );

    assert.deepEqual(
      Array.from(
        draft.checkpoints[0]
          .conditions
      ),
      [
        "Clarify the sampling plan."
      ]
    );
  }
);

test(
  "T3 rejects unknown checkpoint IDs",
  () => {
    const data =
      loadModule();

    const packet =
      reviewablePacket();

    const draft =
      data.createTeacherReviewDraft(
        packet
      ).draft;

    const result =
      data.upsertCheckpointDecision(
        packet,
        draft,
        {
          id:
            "M999",
          status:
            "approved",
          comment:
            "",
          conditions:
            []
        }
      );

    assert.equal(
      result.ok,
      false
    );

    assert.equal(
      result.draft,
      null
    );
  }
);

test(
  "T3 rejects unsupported checkpoint statuses",
  () => {
    const data =
      loadModule();

    const packet =
      reviewablePacket();

    const draft =
      data.createTeacherReviewDraft(
        packet
      ).draft;

    for (
      const status
      of [
        "complete",
        "student_ready",
        "awaiting_teacher",
        "auto_approved"
      ]
    ) {
      const result =
        data.upsertCheckpointDecision(
          packet,
          draft,
          {
            id:
              "M1",
            status,
            comment:
              "",
            conditions:
              []
          }
        );

      assert.equal(
        result.ok,
        false,
        status
      );
    }
  }
);

test(
  "T3 never converts imported blockers or warnings into teacher-authored conditions",
  () => {
    const data =
      loadModule();

    const packet =
      reviewablePacket();

    const draft =
      data.createTeacherReviewDraft(
        packet
      ).draft;

    const result =
      data.upsertCheckpointDecision(
        packet,
        draft,
        {
          id:
            "M1",
          status:
            "revision_requested",
          comment:
            "Teacher-authored comment.",
          conditions:
            []
        }
      );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      result.draft
        .checkpoints[0]
        .conditions.length,
      0
    );

    const serialized =
      JSON.stringify(
        result.draft
      );

    assert.equal(
      serialized.includes(
        "Imported blocker"
      ),
      false
    );

    assert.equal(
      serialized.includes(
        "Imported warning"
      ),
      false
    );
  }
);

test(
  "T3 adds and replaces explicit general teacher feedback",
  () => {
    const data =
      loadModule();

    const packet =
      reviewablePacket();

    let draft =
      data.createTeacherReviewDraft(
        packet
      ).draft;

    draft =
      data.upsertTeacherFeedback(
        packet,
        draft,
        {
          milestone:
            "M1",
          stage:
            2,
          comment:
            "Explain how the variables connect."
        }
      ).draft;

    assert.equal(
      draft.feedback.length,
      1
    );

    assert.equal(
      draft.feedback[0].stage,
      "2"
    );

    draft =
      data.upsertTeacherFeedback(
        packet,
        draft,
        {
          milestone:
            "M1",
          stage:
            "Stage 2",
          comment:
            "Revised teacher comment."
        },
        0
      ).draft;

    assert.equal(
      draft.feedback.length,
      1
    );

    assert.equal(
      draft.feedback[0].comment,
      "Revised teacher comment."
    );
  }
);

test(
  "T3 requires meaningful teacher feedback and rejects unknown feedback milestones",
  () => {
    const data =
      loadModule();

    const packet =
      reviewablePacket();

    const draft =
      data.createTeacherReviewDraft(
        packet
      ).draft;

    const blank =
      data.upsertTeacherFeedback(
        packet,
        draft,
        {
          comment:
            "   "
        }
      );

    assert.equal(
      blank.ok,
      false
    );

    const unknown =
      data.upsertTeacherFeedback(
        packet,
        draft,
        {
          milestone:
            "M999",
          comment:
            "Teacher comment."
        }
      );

    assert.equal(
      unknown.ok,
      false
    );
  }
);

test(
  "T3 does not export an empty review",
  () => {
    const data =
      loadModule();

    const packet =
      reviewablePacket();

    const draft =
      data.createTeacherReviewDraft(
        packet
      ).draft;

    assert.equal(
      data.hasExportableTeacherReview(
        draft
      ),
      false
    );

    const result =
      data.buildTeacherFeedbackPacket(
        packet,
        draft,
        "2026-09-16T04:00:00.000Z"
      );

    assert.equal(
      result.ok,
      false
    );

    assert.equal(
      result.packet,
      null
    );
  }
);

test(
  "T3 builds the exact allowlisted rms_teacher_feedback v1.7 envelope",
  () => {
    const data =
      loadModule();

    const packet =
      reviewablePacket({
        competency_snapshot: {
          private:
            "COMPETENCY-SECRET"
        },
        rawData: [
          {
            private:
              "RAW-SECRET"
          }
        ],
        full_paper_text:
          "PAPER-SECRET",
        full_source_text:
          "SOURCE-SECRET",
        full_source_notes:
          "NOTES-SECRET",
        research_chat_transcript:
          "CHAT-SECRET"
      });

    let draft =
      data.createTeacherReviewDraft(
        packet
      ).draft;

    draft =
      data.setTeacherDisplayName(
        packet,
        draft,
        "Ms. Moon"
      ).draft;

    draft =
      data.upsertCheckpointDecision(
        packet,
        draft,
        {
          id:
            "M1",
          status:
            "revision_requested",
          comment:
            "Revise the sampling explanation.",
          conditions: [
            "Define the sampling frame."
          ]
        }
      ).draft;

    draft =
      data.upsertTeacherFeedback(
        packet,
        draft,
        {
          milestone:
            "M1",
          stage:
            "Stage 2",
          comment:
            "Connect the evidence to the research question."
        }
      ).draft;

    const result =
      data.buildTeacherFeedbackPacket(
        packet,
        draft,
        "2026-09-16T04:05:06.000Z"
      );

    assert.equal(
      result.ok,
      true
    );

    const plain =
      JSON.parse(
        JSON.stringify(
          result.packet
        )
      );

    assert.deepEqual(
      Object.keys(
        plain
      ),
      [
        "packet_type",
        "version",
        "created_at",
        "project_id",
        "student_alias",
        "checkpoints",
        "feedback",
        "competency_ratings"
      ]
    );

    assert.equal(
      plain.packet_type,
      "rms_teacher_feedback"
    );

    assert.equal(
      plain.version,
      "1.7"
    );

    assert.equal(
      plain.created_at,
      "2026-09-16T04:05:06.000Z"
    );

    assert.equal(
      plain.project_id,
      packet.project_id
    );

    assert.equal(
      plain.student_alias,
      "Student One"
    );

    assert.deepEqual(
      plain.competency_ratings,
      []
    );

    assert.deepEqual(
      plain.checkpoints,
      [
        {
          id:
            "M1",
          status:
            "revision_requested",
          reviewedAt:
            "2026-09-16T04:05:06.000Z",
          teacher:
            "Ms. Moon",
          comment:
            "Revise the sampling explanation.",
          conditions: [
            "Define the sampling frame."
          ]
        }
      ]
    );

    assert.deepEqual(
      plain.feedback,
      [
        {
          milestone:
            "M1",
          stage:
            "Stage 2",
          comment:
            "Connect the evidence to the research question.",
          createdAt:
            "2026-09-16T04:05:06.000Z"
        }
      ]
    );

    const serialized =
      JSON.stringify(
        plain
      );

    for (
      const hidden
      of [
        "COMPETENCY-SECRET",
        "RAW-SECRET",
        "PAPER-SECRET",
        "SOURCE-SECRET",
        "NOTES-SECRET",
        "CHAT-SECRET",
        "Existing history must remain read-only.",
        "Imported blocker",
        "Imported warning"
      ]
    ) {
      assert.equal(
        serialized.includes(
          hidden
        ),
        false,
        hidden
      );
    }
  }
);

test(
  "T3 rejects a review draft attached to a different project",
  () => {
    const data =
      loadModule();

    const packet =
      reviewablePacket();

    const draft =
      data.createTeacherReviewDraft(
        packet
      ).draft;

    const wrongProject =
      {
        project_id:
          "RMS-OTHER",
        teacher:
          draft.teacher,
        checkpoints:
          [],
        feedback:
          []
      };

    const result =
      data.validateTeacherReviewDraft(
        packet,
        wrongProject
      );

    assert.equal(
      result.ok,
      false
    );
  }
);

test(
  "T3 review operations never mutate the imported student packet",
  () => {
    const data =
      loadModule();

    const packet =
      reviewablePacket();

    const before =
      JSON.stringify(
        packet
      );

    let draft =
      data.createTeacherReviewDraft(
        packet
      ).draft;

    draft =
      data.setTeacherDisplayName(
        packet,
        draft,
        "Teacher"
      ).draft;

    draft =
      data.upsertCheckpointDecision(
        packet,
        draft,
        {
          id:
            "M1",
          status:
            "approved",
          comment:
            "Reviewed.",
          conditions:
            []
        }
      ).draft;

    draft =
      data.upsertTeacherFeedback(
        packet,
        draft,
        {
          milestone:
            "M1",
          comment:
            "Teacher-authored feedback."
        }
      ).draft;

    const result =
      data.buildTeacherFeedbackPacket(
        packet,
        draft,
        "2026-09-16T05:00:00.000Z"
      );

    assert.equal(
      result.ok,
      true
    );

    assert.equal(
      JSON.stringify(
        packet
      ),
      before
    );
  }
);

test(
  "T3 review draft and exported packet structures are frozen",
  () => {
    const data =
      loadModule();

    const packet =
      reviewablePacket();

    let draft =
      data.createTeacherReviewDraft(
        packet
      ).draft;

    draft =
      data.upsertCheckpointDecision(
        packet,
        draft,
        {
          id:
            "M1",
          status:
            "approved",
          comment:
            "",
          conditions:
            []
        }
      ).draft;

    const result =
      data.buildTeacherFeedbackPacket(
        packet,
        draft,
        "2026-09-16T06:00:00.000Z"
      );

    for (
      const value
      of [
        draft,
        draft.checkpoints,
        draft.checkpoints[0],
        draft.checkpoints[0]
          .conditions,
        result.packet,
        result.packet.checkpoints,
        result.packet.checkpoints[0],
        result.packet
          .checkpoints[0]
          .conditions,
        result.packet.feedback,
        result.packet
          .competency_ratings
      ]
    ) {
      assert.equal(
        Object.isFrozen(value),
        true
      );
    }
  }
);


test(
  "T4 exposes the local assignment setup contract",
  () => {
    const data =
      loadModule();

    assert.equal(
      data.ASSIGNMENT_PACKET_TYPE,
      "rms_assignment_setup"
    );

    assert.equal(
      data.ASSIGNMENT_PACKET_VERSION,
      "1.0"
    );

    assert.deepEqual(
      Array.from(
        data.ASSIGNMENT_MILESTONE_IDS
      ),
      [
        "M1",
        "M2",
        "M3",
        "M4",
        "M5"
      ]
    );

    for (
      const name
      of [
        "createAssignmentDraft",
        "validateAssignmentDraft",
        "updateAssignmentField",
        "updateAssignmentMilestoneDueDate",
        "validateAssignmentPacket",
        "normalizeAssignmentPacket",
        "assignmentDraftFromPacket",
        "buildAssignmentPacket"
      ]
    ) {
      assert.equal(
        typeof data[name],
        "function",
        name
      );
    }
  }
);

test(
  "T4 creates an empty frozen assignment draft with exactly five milestone dates",
  () => {
    const data =
      loadModule();

    const result =
      data.createAssignmentDraft();

    assert.equal(
      result.ok,
      true
    );

    assert.deepEqual(
      JSON.parse(
        JSON.stringify(
          result.draft
        )
      ),
      {
        assignment_id:
          "",
        title:
          "",
        course_section:
          "",
        teacher_display_name:
          "",
        student_instructions:
          "",
        teacher_notes:
          "",
        milestone_due_dates: {
          M1: "",
          M2: "",
          M3: "",
          M4: "",
          M5: ""
        }
      }
    );

    assert.equal(
      Object.isFrozen(
        result.draft
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        result.draft
          .milestone_due_dates
      ),
      true
    );
  }
);

test(
  "T4 requires assignment identity and title before export",
  () => {
    const data =
      loadModule();

    const draft =
      data
        .createAssignmentDraft()
        .draft;

    const validation =
      data.validateAssignmentDraft(
        draft
      );

    assert.equal(
      validation.ok,
      false
    );

    assert.match(
      validation.errors.join(
        " "
      ),
      /assignment_id is required/i
    );

    assert.match(
      validation.errors.join(
        " "
      ),
      /title is required/i
    );

    const built =
      data.buildAssignmentPacket(
        draft,
        "2026-09-16T07:00:00.000Z"
      );

    assert.equal(
      built.ok,
      false
    );

    assert.equal(
      built.packet,
      null
    );
  }
);

test(
  "T4 updates assignment text immutably and accepts empty optional text",
  () => {
    const data =
      loadModule();

    const first =
      data
        .createAssignmentDraft()
        .draft;

    const second =
      data.updateAssignmentField(
        first,
        "assignment_id",
        "BIO-AR-01"
      ).draft;

    const third =
      data.updateAssignmentField(
        second,
        "title",
        "AP Biology Action Research"
      ).draft;

    const fourth =
      data.updateAssignmentField(
        third,
        "student_instructions",
        ""
      ).draft;

    assert.equal(
      first.assignment_id,
      ""
    );

    assert.equal(
      second.assignment_id,
      "BIO-AR-01"
    );

    assert.equal(
      third.title,
      "AP Biology Action Research"
    );

    assert.equal(
      fourth.student_instructions,
      ""
    );

    assert.notEqual(
      first,
      second
    );

    assert.notEqual(
      second,
      third
    );

    assert.equal(
      Object.isFrozen(
        fourth
      ),
      true
    );
  }
);

test(
  "T4 rejects unsupported assignment fields",
  () => {
    const data =
      loadModule();

    const draft =
      data
        .createAssignmentDraft()
        .draft;

    const result =
      data.updateAssignmentField(
        draft,
        "grade_weight",
        "20"
      );

    assert.equal(
      result.ok,
      false
    );

    assert.equal(
      result.draft,
      null
    );
  }
);

test(
  "T4 accepts valid milestone dates and rejects unknown milestones or invalid calendar dates",
  () => {
    const data =
      loadModule();

    let draft =
      data
        .createAssignmentDraft()
        .draft;

    const validDates = {
      M1:
        "2026-09-30",
      M2:
        "2026-10-14",
      M3:
        "2026-10-28",
      M4:
        "2026-11-11",
      M5:
        "2026-11-25"
    };

    for (
      const [
        milestone,
        date
      ]
      of Object.entries(
        validDates
      )
    ) {
      const result =
        data
          .updateAssignmentMilestoneDueDate(
            draft,
            milestone,
            date
          );

      assert.equal(
        result.ok,
        true,
        milestone
      );

      draft =
        result.draft;
    }

    assert.deepEqual(
      JSON.parse(
        JSON.stringify(
          draft.milestone_due_dates
        )
      ),
      validDates
    );

    assert.equal(
      data
        .updateAssignmentMilestoneDueDate(
          draft,
          "M6",
          "2026-12-01"
        )
        .ok,
      false
    );

    for (
      const invalid
      of [
        "09/30/2026",
        "2026-02-30",
        "2026-13-01",
        "2026-9-01",
        "tomorrow"
      ]
    ) {
      assert.equal(
        data
          .updateAssignmentMilestoneDueDate(
            draft,
            "M1",
            invalid
          )
          .ok,
        false,
        invalid
      );
    }

    assert.equal(
      data
        .updateAssignmentMilestoneDueDate(
          draft,
          "M1",
          ""
        )
        .ok,
      true
    );
  }
);

test(
  "T4 validates strict assignment packet type version and allowlist",
  () => {
    const data =
      loadModule();

    let draft =
      data
        .createAssignmentDraft()
        .draft;

    draft =
      data.updateAssignmentField(
        draft,
        "assignment_id",
        "BIO-AR-01"
      ).draft;

    draft =
      data.updateAssignmentField(
        draft,
        "title",
        "Action Research"
      ).draft;

    const packet =
      JSON.parse(
        JSON.stringify(
          data.buildAssignmentPacket(
            draft,
            "2026-09-16T07:15:00.000Z"
          ).packet
        )
      );

    assert.equal(
      data
        .validateAssignmentPacket(
          packet
        )
        .ok,
      true
    );

    assert.equal(
      data
        .validateAssignmentPacket({
          ...packet,
          packet_type:
            "wrong"
        })
        .ok,
      false
    );

    assert.equal(
      data
        .validateAssignmentPacket({
          ...packet,
          version:
            "2.0"
        })
        .ok,
      false
    );

    assert.equal(
      data
        .validateAssignmentPacket({
          ...packet,
          project_id:
            "STUDENT-PROJECT"
        })
        .ok,
      false
    );

    assert.equal(
      data
        .validateAssignmentPacket({
          ...packet,
          milestone_due_dates: {
            ...packet
              .milestone_due_dates,
            M6:
              "2026-12-01"
          }
        })
        .ok,
      false
    );
  }
);

test(
  "T4 builds the exact allowlisted rms_assignment_setup version 1.0 packet",
  () => {
    const data =
      loadModule();

    let draft =
      data
        .createAssignmentDraft()
        .draft;

    const values = {
      assignment_id:
        "BIO-AR-01",
      title:
        "AP Biology Action Research",
      course_section:
        "Period 2",
      teacher_display_name:
        "Ms. Moon",
      student_instructions:
        "Use the Research Journey for each checkpoint.",
      teacher_notes:
        "Review M3 carefully."
    };

    for (
      const [
        field,
        value
      ]
      of Object.entries(
        values
      )
    ) {
      draft =
        data.updateAssignmentField(
          draft,
          field,
          value
        ).draft;
    }

    draft =
      data
        .updateAssignmentMilestoneDueDate(
          draft,
          "M1",
          "2026-09-30"
        )
        .draft;

    const result =
      data.buildAssignmentPacket(
        draft,
        "2026-09-16T07:30:00.000Z"
      );

    assert.equal(
      result.ok,
      true
    );

    const plain =
      JSON.parse(
        JSON.stringify(
          result.packet
        )
      );

    assert.deepEqual(
      Object.keys(
        plain
      ),
      [
        "packet_type",
        "version",
        "created_at",
        "assignment_id",
        "title",
        "course_section",
        "teacher_display_name",
        "student_instructions",
        "teacher_notes",
        "milestone_due_dates"
      ]
    );

    assert.equal(
      plain.packet_type,
      "rms_assignment_setup"
    );

    assert.equal(
      plain.version,
      "1.0"
    );

    assert.equal(
      plain.created_at,
      "2026-09-16T07:30:00.000Z"
    );

    assert.deepEqual(
      plain.milestone_due_dates,
      {
        M1:
          "2026-09-30",
        M2:
          "",
        M3:
          "",
        M4:
          "",
        M5:
          ""
      }
    );

    for (
      const forbidden
      of [
        "project_id",
        "student_alias",
        "stage_ready",
        "checkpoints",
        "methods",
        "analysis",
        "writing",
        "teacher_feedback",
        "competency_ratings",
        "grade",
        "grade_weight"
      ]
    ) {
      assert.equal(
        forbidden in plain,
        false,
        forbidden
      );
    }
  }
);

test(
  "T4 imports a validated assignment packet into an independent frozen draft",
  () => {
    const data =
      loadModule();

    let draft =
      data
        .createAssignmentDraft()
        .draft;

    draft =
      data.updateAssignmentField(
        draft,
        "assignment_id",
        "BIO-AR-02"
      ).draft;

    draft =
      data.updateAssignmentField(
        draft,
        "title",
        "Second Assignment"
      ).draft;

    draft =
      data
        .updateAssignmentMilestoneDueDate(
          draft,
          "M3",
          "2026-10-28"
        )
        .draft;

    const packet =
      data.buildAssignmentPacket(
        draft,
        "2026-09-16T08:00:00.000Z"
      ).packet;

    const imported =
      data.assignmentDraftFromPacket(
        JSON.parse(
          JSON.stringify(
            packet
          )
        )
      );

    assert.equal(
      imported.ok,
      true
    );

    assert.equal(
      imported.draft.assignment_id,
      "BIO-AR-02"
    );

    assert.equal(
      imported.draft
        .milestone_due_dates
        .M3,
      "2026-10-28"
    );

    assert.equal(
      "created_at"
        in imported.draft,
      false
    );

    assert.equal(
      Object.isFrozen(
        imported.draft
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        imported.draft
          .milestone_due_dates
      ),
      true
    );
  }
);

test(
  "T4 rejects malformed imported packets and invalid export timestamps",
  () => {
    const data =
      loadModule();

    let draft =
      data
        .createAssignmentDraft()
        .draft;

    draft =
      data.updateAssignmentField(
        draft,
        "assignment_id",
        "BIO-AR-03"
      ).draft;

    draft =
      data.updateAssignmentField(
        draft,
        "title",
        "Third Assignment"
      ).draft;

    const built =
      data.buildAssignmentPacket(
        draft,
        "not-a-time"
      );

    assert.equal(
      built.ok,
      false
    );

    assert.equal(
      built.packet,
      null
    );

    const malformed =
      data.assignmentDraftFromPacket({
        packet_type:
          "rms_assignment_setup",
        version:
          "1.0"
      });

    assert.equal(
      malformed.ok,
      false
    );

    assert.equal(
      malformed.draft,
      null
    );
  }
);

test(
  "T4 assignment draft normalized packet and exported packet structures are frozen",
  () => {
    const data =
      loadModule();

    let draft =
      data
        .createAssignmentDraft()
        .draft;

    draft =
      data.updateAssignmentField(
        draft,
        "assignment_id",
        "BIO-AR-04"
      ).draft;

    draft =
      data.updateAssignmentField(
        draft,
        "title",
        "Frozen Assignment"
      ).draft;

    const built =
      data.buildAssignmentPacket(
        draft,
        "2026-09-16T08:30:00.000Z"
      );

    const normalized =
      data.normalizeAssignmentPacket(
        JSON.parse(
          JSON.stringify(
            built.packet
          )
        )
      );

    for (
      const value
      of [
        draft,
        draft.milestone_due_dates,
        built.packet,
        built.packet
          .milestone_due_dates,
        normalized.packet,
        normalized.packet
          .milestone_due_dates
      ]
    ) {
      assert.equal(
        Object.isFrozen(value),
        true
      );
    }
  }
);


function analyticsMilestone(
  id,
  state,
  blockers = []
) {
  return {
    id,
    title:
      `${id} test milestone`,
    state,
    blockers,
    warnings: [],
    checkpoint: {
      status: "",
      requestedAt: "",
      reviewedAt: "",
      teacher: "",
      comment: "",
      conditions: []
    }
  };
}

function plainAnalytics(
  value
) {
  return JSON.parse(
    JSON.stringify(
      value
    )
  );
}

test(
  "T5 exposes the pure teacher analytics derivation",
  () => {
    const data =
      loadModule();

    assert.equal(
      typeof data
        .deriveTeacherAnalytics,
      "function"
    );
  }
);

test(
  "T5 returns the empty teacher analytics model",
  () => {
    const data =
      loadModule();

    const analytics =
      plainAnalytics(
        data.deriveTeacherAnalytics(
          []
        )
      );

    assert.equal(
      analytics.project_count,
      0
    );

    assert.equal(
      analytics
        .stage_readiness
        .length,
      18
    );

    assert.equal(
      analytics
        .milestone_states
        .length,
      5
    );

    assert.deepEqual(
      analytics.course_sections,
      []
    );

    assert.deepEqual(
      analytics.workflow_counts,
      {
        projects_awaiting_teacher:
          0,
        projects_revision_requested:
          0,
        projects_with_blockers:
          0,
        ethics_teacher_review:
          0,
        ethics_do_not_facilitate:
          0,
        locked_protocols:
          0,
        projects_with_stored_analysis:
          0
      }
    );

    assert.deepEqual(
      analytics.literature_status,
      {
        projects_with_included_sources:
          0,
        projects_with_verified_sources:
          0
      }
    );
  }
);

test(
  "T5 stage readiness contains exactly stages 1 through 18 and counts only true",
  () => {
    const data =
      loadModule();

    const analytics =
      plainAnalytics(
        data.deriveTeacherAnalytics([
          minimalPacket({
            project_id:
              "RMS-T5-STAGE-A",
            stage_ready: {
              1: true,
              2: false,
              3: "true",
              18: true
            }
          }),
          minimalPacket({
            project_id:
              "RMS-T5-STAGE-B",
            stage_ready: {
              1: true,
              2: true,
              18: false
            }
          })
        ])
      );

    assert.deepEqual(
      analytics
        .stage_readiness
        .map(
          row =>
            row.stage
        ),
      Array.from(
        {
          length: 18
        },
        (
          _,
          index
        ) =>
          index + 1
      )
    );

    assert.deepEqual(
      analytics
        .stage_readiness
        .slice(0, 3)
        .map(
          row => [
            row.stage,
            row.ready_projects,
            row.project_count
          ]
        ),
      [
        [1, 2, 2],
        [2, 1, 2],
        [3, 0, 2]
      ]
    );

    assert.equal(
      analytics
        .stage_readiness[17]
        .ready_projects,
      1
    );
  }
);

test(
  "T5 missing stage information is not counted as ready",
  () => {
    const data =
      loadModule();

    const analytics =
      plainAnalytics(
        data.deriveTeacherAnalytics([
          minimalPacket({
            project_id:
              "RMS-T5-MISSING-STAGE"
          })
        ])
      );

    for (
      const row
      of analytics.stage_readiness
    ) {
      assert.equal(
        row.ready_projects,
        0
      );

      assert.equal(
        row.project_count,
        1
      );
    }
  }
);

test(
  "T5 returns exactly M1 through M5 milestone distributions",
  () => {
    const data =
      loadModule();

    const analytics =
      plainAnalytics(
        data.deriveTeacherAnalytics(
          []
        )
      );

    assert.deepEqual(
      analytics
        .milestone_states
        .map(
          row =>
            row.milestone_id
        ),
      [
        "M1",
        "M2",
        "M3",
        "M4",
        "M5"
      ]
    );
  }
);

test(
  "T5 counts every canonical milestone state",
  () => {
    const data =
      loadModule();

    const states = [
      "blocked",
      "student_ready",
      "awaiting_teacher",
      "revision_requested",
      "approved",
      "complete"
    ];

    const packets =
      states.map(
        (
          state,
          index
        ) =>
          minimalPacket({
            project_id:
              `RMS-T5-STATE-${index}`,
            milestones: [
              analyticsMilestone(
                "M1",
                state
              )
            ]
          })
      );

    const analytics =
      plainAnalytics(
        data.deriveTeacherAnalytics(
          packets
        )
      );

    const m1 =
      analytics
        .milestone_states[0];

    for (
      const state
      of states
    ) {
      assert.equal(
        m1[state],
        1,
        state
      );
    }

    assert.equal(
      m1.other_or_missing,
      0
    );

    assert.equal(
      m1.project_count,
      states.length
    );
  }
);

test(
  "T5 maps unknown missing and duplicate milestone records to other_or_missing",
  () => {
    const data =
      loadModule();

    const analytics =
      plainAnalytics(
        data.deriveTeacherAnalytics([
          minimalPacket({
            project_id:
              "RMS-T5-UNKNOWN",
            milestones: [
              analyticsMilestone(
                "M1",
                "mystery_state"
              )
            ]
          }),
          minimalPacket({
            project_id:
              "RMS-T5-MISSING",
            milestones: []
          }),
          minimalPacket({
            project_id:
              "RMS-T5-DUPLICATE",
            milestones: [
              analyticsMilestone(
                "M1",
                "approved"
              ),
              analyticsMilestone(
                "M1",
                "complete"
              )
            ]
          })
        ])
      );

    const m1 =
      analytics
        .milestone_states[0];

    assert.equal(
      m1.other_or_missing,
      3
    );

    assert.equal(
      m1.approved,
      0
    );

    assert.equal(
      m1.complete,
      0
    );

    assert.equal(
      m1.project_count,
      3
    );
  }
);

test(
  "T5 makes every valid project contribute exactly once to every milestone distribution",
  () => {
    const data =
      loadModule();

    const analytics =
      plainAnalytics(
        data.deriveTeacherAnalytics([
          minimalPacket({
            project_id:
              "RMS-T5-ONCE-A",
            milestones: [
              analyticsMilestone(
                "M1",
                "approved"
              ),
              analyticsMilestone(
                "M3",
                "awaiting_teacher"
              )
            ]
          }),
          minimalPacket({
            project_id:
              "RMS-T5-ONCE-B",
            milestones: [
              analyticsMilestone(
                "M2",
                "complete"
              ),
              analyticsMilestone(
                "M5",
                "revision_requested"
              )
            ]
          })
        ])
      );

    for (
      const milestone
      of analytics
        .milestone_states
    ) {
      const sum = [
        "blocked",
        "student_ready",
        "awaiting_teacher",
        "revision_requested",
        "approved",
        "complete",
        "other_or_missing"
      ].reduce(
        (
          total,
          key
        ) =>
          total +
          milestone[key],
        0
      );

      assert.equal(
        sum,
        2,
        milestone.milestone_id
      );

      assert.equal(
        milestone.project_count,
        2
      );
    }
  }
);

test(
  "T5 workflow counts are project-level descriptive counts",
  () => {
    const data =
      loadModule();

    const analytics =
      plainAnalytics(
        data.deriveTeacherAnalytics([
          minimalPacket({
            project_id:
              "RMS-T5-WORKFLOW-A",
            milestones: [
              analyticsMilestone(
                "M1",
                "awaiting_teacher",
                [
                  "Blocker A"
                ]
              ),
              analyticsMilestone(
                "M3",
                "awaiting_teacher"
              )
            ],
            methods: {
              ethicsStatus:
                "teacher_review",
              locked:
                true
            },
            analysis: {
              stored_runs:
                2
            }
          }),
          minimalPacket({
            project_id:
              "RMS-T5-WORKFLOW-B",
            milestones: [
              analyticsMilestone(
                "M2",
                "revision_requested",
                [
                  "Blocker B"
                ]
              )
            ],
            methods: {
              ethicsStatus:
                "do_not_facilitate",
              locked:
                false
            },
            analysis: {
              stored_runs:
                0
            }
          }),
          minimalPacket({
            project_id:
              "RMS-T5-WORKFLOW-C",
            milestones: []
          })
        ])
      );

    assert.deepEqual(
      analytics.workflow_counts,
      {
        projects_awaiting_teacher:
          1,
        projects_revision_requested:
          1,
        projects_with_blockers:
          2,
        ethics_teacher_review:
          1,
        ethics_do_not_facilitate:
          1,
        locked_protocols:
          1,
        projects_with_stored_analysis:
          1
      }
    );
  }
);

test(
  "T5 ethics locked-protocol and analysis counts require exact affirmative evidence",
  () => {
    const data =
      loadModule();

    const analytics =
      plainAnalytics(
        data.deriveTeacherAnalytics([
          minimalPacket({
            project_id:
              "RMS-T5-EXACT-A",
            methods: {
              ethicsStatus:
                "Teacher_Review",
              locked:
                "true"
            },
            analysis: {
              stored_runs:
                "2"
            }
          }),
          minimalPacket({
            project_id:
              "RMS-T5-EXACT-B",
            methods: {
              ethicsStatus:
                "teacher_review",
              locked:
                true
            },
            analysis: {
              stored_runs:
                1
            }
          })
        ])
      );

    assert.equal(
      analytics
        .workflow_counts
        .ethics_teacher_review,
      1
    );

    assert.equal(
      analytics
        .workflow_counts
        .locked_protocols,
      1
    );

    assert.equal(
      analytics
        .workflow_counts
        .projects_with_stored_analysis,
      1
    );
  }
);

test(
  "T5 groups course sections with a neutral unspecified category",
  () => {
    const data =
      loadModule();

    const analytics =
      plainAnalytics(
        data.deriveTeacherAnalytics([
          minimalPacket({
            project_id:
              "RMS-T5-SECTION-A",
            course_section:
              "Period 2"
          }),
          minimalPacket({
            project_id:
              "RMS-T5-SECTION-B",
            course_section:
              ""
          }),
          minimalPacket({
            project_id:
              "RMS-T5-SECTION-C",
            course_section:
              "   "
          }),
          minimalPacket({
            project_id:
              "RMS-T5-SECTION-D",
            course_section:
              "Period 2"
          })
        ])
      );

    assert.deepEqual(
      analytics.course_sections,
      [
        {
          course_section:
            "Period 2",
          project_count:
            2
        },
        {
          course_section:
            "Unspecified",
          project_count:
            2
        }
      ]
    );
  }
);

test(
  "T5 course-section ordering is deterministic and does not depend on input order",
  () => {
    const data =
      loadModule();

    const packets = [
      minimalPacket({
        project_id:
          "RMS-T5-ORDER-Z",
        course_section:
          "Zeta"
      }),
      minimalPacket({
        project_id:
          "RMS-T5-ORDER-A",
        course_section:
          "Alpha"
      }),
      minimalPacket({
        project_id:
          "RMS-T5-ORDER-B",
        course_section:
          "Beta"
      })
    ];

    const first =
      plainAnalytics(
        data.deriveTeacherAnalytics(
          packets
        )
      );

    const second =
      plainAnalytics(
        data.deriveTeacherAnalytics(
          packets.slice().reverse()
        )
      );

    assert.deepEqual(
      first.course_sections,
      [
        {
          course_section:
            "Alpha",
          project_count:
            1
        },
        {
          course_section:
            "Beta",
          project_count:
            1
        },
        {
          course_section:
            "Zeta",
          project_count:
            1
        }
      ]
    );

    assert.deepEqual(
      second.course_sections,
      first.course_sections
    );
  }
);

test(
  "T5 literature analytics report presence counts only",
  () => {
    const data =
      loadModule();

    const analytics =
      plainAnalytics(
        data.deriveTeacherAnalytics([
          minimalPacket({
            project_id:
              "RMS-T5-LIT-A",
            sources: {
              included:
                5,
              verified:
                3
            }
          }),
          minimalPacket({
            project_id:
              "RMS-T5-LIT-B",
            sources: {
              included:
                2,
              verified:
                0
            }
          }),
          minimalPacket({
            project_id:
              "RMS-T5-LIT-C",
            sources: {
              included:
                0,
              verified:
                0
            }
          }),
          minimalPacket({
            project_id:
              "RMS-T5-LIT-D"
          })
        ])
      );

    assert.deepEqual(
      analytics.literature_status,
      {
        projects_with_included_sources:
          2,
        projects_with_verified_sources:
          1
      }
    );

    assert.equal(
      "mean_included_sources"
        in analytics
          .literature_status,
      false
    );
  }
);

test(
  "T5 analytics ignore methods diagnostic scores and labels",
  () => {
    const data =
      loadModule();

    const base = {
      project_id:
        "RMS-T5-METHOD-SCORE",
      methods: {
        ethicsStatus:
          "",
        locked:
          false,
        score:
          1,
        label:
          "low",
        critical:
          9,
        warning:
          8
      }
    };

    const changed = {
      ...base,
      methods: {
        ...base.methods,
        score:
          999,
        label:
          "high",
        critical:
          0,
        warning:
          0
      }
    };

    const first =
      plainAnalytics(
        data.deriveTeacherAnalytics([
          minimalPacket(
            base
          )
        ])
      );

    const second =
      plainAnalytics(
        data.deriveTeacherAnalytics([
          minimalPacket(
            changed
          )
        ])
      );

    assert.deepEqual(
      second,
      first
    );
  }
);

test(
  "T5 analytics ignore competency snapshots and teacher competency ratings",
  () => {
    const data =
      loadModule();

    const firstPacket =
      minimalPacket({
        project_id:
          "RMS-T5-COMPETENCY",
        competency_snapshot: {
          overall:
            3,
          dimensions: [
            {
              level: 3
            }
          ]
        },
        competency_ratings: [
          {
            rating: 3
          }
        ]
      });

    const secondPacket =
      minimalPacket({
        project_id:
          "RMS-T5-COMPETENCY",
        competency_snapshot: {
          overall:
            0
        },
        competency_ratings: [
          {
            rating: 0
          }
        ]
      });

    assert.deepEqual(
      plainAnalytics(
        data.deriveTeacherAnalytics([
          firstPacket
        ])
      ),
      plainAnalytics(
        data.deriveTeacherAnalytics([
          secondPacket
        ])
      )
    );
  }
);

test(
  "T5 analytics ignore writing word counts and paper-audit values",
  () => {
    const data =
      loadModule();

    const first =
      minimalPacket({
        project_id:
          "RMS-T5-WRITING",
        writing: {
          paper_audit: {
            score:
              1,
            label:
              "first"
          },
          section_words: {
            introduction:
              100,
            methods:
              200
          }
        }
      });

    const second =
      minimalPacket({
        project_id:
          "RMS-T5-WRITING",
        writing: {
          paper_audit: {
            score:
              99,
            label:
              "second"
          },
          section_words: {
            introduction:
              9000,
            methods:
              8000
          }
        }
      });

    assert.deepEqual(
      plainAnalytics(
        data.deriveTeacherAnalytics([
          first
        ])
      ),
      plainAnalytics(
        data.deriveTeacherAnalytics([
          second
        ])
      )
    );
  }
);

test(
  "T5 analytics expose no student ranking grading prediction or composite output",
  () => {
    const data =
      loadModule();

    const analytics =
      plainAnalytics(
        data.deriveTeacherAnalytics([
          minimalPacket({
            project_id:
              "RMS-T5-NO-SCORE",
            student_alias:
              "Student A"
          })
        ])
      );

    const json =
      JSON.stringify(
        analytics
      ).toLowerCase();

    for (
      const forbidden
      of [
        "student_alias",
        "rank",
        "leaderboard",
        "grade",
        "percentile",
        "risk",
        "prediction",
        "probability",
        "competency",
        "mastery",
        "proficiency",
        "overall_score",
        "progress_score",
        "performance_score"
      ]
    ) {
      assert.equal(
        json.includes(
          forbidden
        ),
        false,
        forbidden
      );
    }
  }
);

test(
  "T5 analytics are deterministic for the same normalized packet collection",
  () => {
    const data =
      loadModule();

    const packets = [
      minimalPacket({
        project_id:
          "RMS-T5-DETERMINISTIC-A",
        course_section:
          "A",
        stage_ready: {
          1: true,
          7: true
        }
      }),
      minimalPacket({
        project_id:
          "RMS-T5-DETERMINISTIC-B",
        course_section:
          "B",
        milestones: [
          analyticsMilestone(
            "M4",
            "approved"
          )
        ]
      })
    ];

    const first =
      plainAnalytics(
        data.deriveTeacherAnalytics(
          packets
        )
      );

    const second =
      plainAnalytics(
        data.deriveTeacherAnalytics(
          packets
        )
      );

    assert.deepEqual(
      second,
      first
    );
  }
);

test(
  "T5 analytics structures are recursively frozen at their public aggregate boundaries",
  () => {
    const data =
      loadModule();

    const analytics =
      data.deriveTeacherAnalytics([
        minimalPacket({
          project_id:
            "RMS-T5-FROZEN",
          course_section:
            "Section A"
        })
      ]);

    const values = [
      analytics,
      analytics.stage_readiness,
      analytics.stage_readiness[0],
      analytics.milestone_states,
      analytics.milestone_states[0],
      analytics.workflow_counts,
      analytics.course_sections,
      analytics.course_sections[0],
      analytics.literature_status
    ];

    for (
      const value
      of values
    ) {
      assert.equal(
        Object.isFrozen(
          value
        ),
        true
      );
    }
  }
);

test(
  "T5 analytics do not mutate source packet arrays or packet content",
  () => {
    const data =
      loadModule();

    const packets = [
      minimalPacket({
        project_id:
          "RMS-T5-NOMUTATE",
        course_section:
          "Original",
        stage_ready: {
          1: true
        },
        milestones: [
          analyticsMilestone(
            "M1",
            "student_ready"
          )
        ]
      })
    ];

    const before =
      JSON.stringify(
        packets
      );

    data.deriveTeacherAnalytics(
      packets
    );

    assert.equal(
      JSON.stringify(
        packets
      ),
      before
    );
  }
);

test(
  "T5 analytics reuse project-id deduplication and the later whole packet",
  () => {
    const data =
      loadModule();

    const analytics =
      plainAnalytics(
        data.deriveTeacherAnalytics([
          minimalPacket({
            project_id:
              "RMS-T5-DUPE-PROJECT",
            course_section:
              "First",
            stage_ready: {
              1: true
            }
          }),
          minimalPacket({
            project_id:
              "RMS-T5-DUPE-PROJECT",
            course_section:
              "Second",
            stage_ready: {
              2: true
            }
          })
        ])
      );

    assert.equal(
      analytics.project_count,
      1
    );

    assert.equal(
      analytics
        .stage_readiness[0]
        .ready_projects,
      0
    );

    assert.equal(
      analytics
        .stage_readiness[1]
        .ready_projects,
      1
    );

    assert.deepEqual(
      analytics.course_sections,
      [
        {
          course_section:
            "Second",
          project_count:
            1
        }
      ]
    );
  }
);

test(
  "T5 analytics remain browser-independent and do not call the student analytics engine",
  () => {
    const data =
      loadModule();

    const analytics =
      data.deriveTeacherAnalytics([
        minimalPacket({
          project_id:
            "RMS-T5-PURE"
        })
      ]);

    assert.equal(
      analytics.project_count,
      1
    );

    assert.equal(
      source.includes(
        "window.RMSAnalytics"
      ),
      false
    );

    assert.equal(
      source.includes(
        "deriveTeacherAnalytics"
      ),
      true
    );
  }
);

test(
  "T6 exposes the pure teacher Chat Controls status derivation",
  () => {
    const data =
      loadModule();

    assert.equal(
      typeof data
        .deriveTeacherChatControlsStatus,
      "function"
    );
  }
);

test(
  "T6 keeps absent malformed and credential-bearing Chat endpoints unconfigured",
  () => {
    const data =
      loadModule();

    const values = [
      undefined,
      null,
      "",
      "not-a-url",
      "https://user:secret@example.com/chat",
      "ftp://example.com/chat"
    ];

    for (
      const value
      of values
    ) {
      const status =
        data
          .deriveTeacherChatControlsStatus({
            research_chat_endpoint:
              value
          });

      assert.equal(
        status.service
          .configured,
        false
      );

      assert.equal(
        status.service
          .endpoint_origin,
        ""
      );
    }
  }
);

test(
  "T6 reports only the safely parsed Research Chat endpoint origin",
  () => {
    const data =
      loadModule();

    const status =
      data
        .deriveTeacherChatControlsStatus({
          research_chat_endpoint:
            "https://rms-research-chat-free.gmoon-code.workers.dev/path?q=1#x"
        });

    assert.equal(
      status.service
        .configured,
      true
    );

    assert.equal(
      status.service
        .endpoint_origin,
      "https://rms-research-chat-free.gmoon-code.workers.dev"
    );
  }
);

test(
  "T6 copies runtime edition and teacher-session status descriptively",
  () => {
    const data =
      loadModule();

    const active =
      data
        .deriveTeacherChatControlsStatus({
          runtime_version:
            " 2.16.0 ",
          free_edition:
            true,
          teacher_session_active:
            true
        });

    assert.equal(
      active.service
        .runtime_version,
      "2.16.0"
    );

    assert.equal(
      active.service
        .free_edition,
      true
    );

    assert.equal(
      active.teacher_session
        .active,
      true
    );

    const inactive =
      data
        .deriveTeacherChatControlsStatus({
          free_edition:
            false,
          teacher_session_active:
            false
        });

    assert.equal(
      inactive.service
        .free_edition,
      false
    );

    assert.equal(
      inactive.teacher_session
        .active,
      false
    );
  }
);

test(
  "T6 copies only explicit local Chat and class-code presence booleans",
  () => {
    const data =
      loadModule();

    const enabled =
      data
        .deriveTeacherChatControlsStatus({
          local_chat_enabled:
            true,
          class_chat_code_present:
            true
        });

    assert.equal(
      enabled.local_preview
        .chat_enabled,
      true
    );

    assert.equal(
      enabled.local_preview
        .class_code_present,
      true
    );

    assert.equal(
      enabled.local_preview
        .scope,
      "browser_session_only"
    );

    const neutral =
      data
        .deriveTeacherChatControlsStatus({
          local_chat_enabled:
            "true",
          class_chat_code_present:
            1
        });

    assert.equal(
      neutral.local_preview
        .chat_enabled,
      false
    );

    assert.equal(
      neutral.local_preview
        .class_code_present,
      false
    );
  }
);

test(
  "T6 fixes the teacher Chat privacy boundary in the public status model",
  () => {
    const data =
      loadModule();

    const status =
      data
        .deriveTeacherChatControlsStatus({
          transcripts_exposed:
            true,
          project_context_teacher_controlled:
            true,
          endpoint_teacher_editable:
            true,
          classwide_policy_available:
            true
        });

    assert.deepEqual(
      {
        ...status.privacy
      },
      {
        transcripts_exposed:
          false,
        project_context_teacher_controlled:
          false,
        endpoint_teacher_editable:
          false,
        classwide_policy_available:
          false
      }
    );
  }
);

test(
  "T6 Chat Controls status derivation ignores unapproved input fields",
  () => {
    const data =
      loadModule();

    const status =
      data
        .deriveTeacherChatControlsStatus({
          runtime_version:
            "2.16.0",
          free_edition:
            true,
          research_chat_endpoint:
            "https://example.com/chat",
          teacher_session_active:
            true,
          local_chat_enabled:
            true,
          class_chat_code_present:
            false,
          student_alias:
            "Student A",
          project:
            {
              research_question:
                "must not appear"
            },
          messages: [
            "must not appear"
          ],
          access_code:
            "secret",
          teacher_token:
            "secret"
        });

    const serialized =
      JSON.stringify(
        status
      );

    for (
      const forbidden
      of [
        "Student A",
        "must not appear",
        "secret",
        "student_alias",
        "messages",
        "access_code",
        "teacher_token"
      ]
    ) {
      assert.equal(
        serialized.includes(
          forbidden
        ),
        false,
        forbidden
      );
    }
  }
);

test(
  "T6 Chat Controls status model is recursively frozen at public boundaries",
  () => {
    const data =
      loadModule();

    const status =
      data
        .deriveTeacherChatControlsStatus({
          research_chat_endpoint:
            "https://example.com/chat"
        });

    assert.equal(
      Object.isFrozen(
        status
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        status.service
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        status.teacher_session
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        status.local_preview
      ),
      true
    );

    assert.equal(
      Object.isFrozen(
        status.privacy
      ),
      true
    );
  }
);

test(
  "T6 Chat Controls status derivation does not mutate its source input",
  () => {
    const data =
      loadModule();

    const input = {
      runtime_version:
        "2.16.0",
      free_edition:
        true,
      research_chat_endpoint:
        "https://example.com/chat",
      teacher_session_active:
        true,
      local_chat_enabled:
        false,
      class_chat_code_present:
        true
    };

    const before =
      JSON.stringify(
        input
      );

    data
      .deriveTeacherChatControlsStatus(
        input
      );

    assert.equal(
      JSON.stringify(
        input
      ),
      before
    );
  }
);

test(
  "T6 Chat Controls status derivation is deterministic",
  () => {
    const data =
      loadModule();

    const input = {
      runtime_version:
        "2.16.0",
      free_edition:
        true,
      research_chat_endpoint:
        "https://example.com/path",
      teacher_session_active:
        true,
      local_chat_enabled:
        true,
      class_chat_code_present:
        true
    };

    const first =
      JSON.stringify(
        data
          .deriveTeacherChatControlsStatus(
            input
          )
      );

    const second =
      JSON.stringify(
        data
          .deriveTeacherChatControlsStatus(
            input
          )
      );

    assert.equal(
      first,
      second
    );
  }
);

test(
  "T6 Chat Controls status derivation remains independent of packets browser storage and network state",
  () => {
    const data =
      loadModule();

    const status =
      data
        .deriveTeacherChatControlsStatus({
          research_chat_endpoint:
            "https://example.com/chat",
          runtime_version:
            "2.16.0",
          free_edition:
            true,
          teacher_session_active:
            true,
          local_chat_enabled:
            true,
          class_chat_code_present:
            false
        });

    assert.deepEqual(
      Object.keys(
        status
      ),
      [
        "service",
        "teacher_session",
        "local_preview",
        "privacy"
      ]
    );

    assert.equal(
      "project_count"
        in status,
      false
    );

    assert.equal(
      "packets"
        in status,
      false
    );

    assert.equal(
      "network"
        in status,
      false
    );

    assert.equal(
      "storage"
        in status,
      false
    );
  }
);

test(
  "T7 exposes the pure teacher Recovery inspection derivation",
  () => {
    const data =
      loadModule();

    assert.equal(
      typeof data
        .deriveTeacherRecoveryInspection,
      "function"
    );
  }
);

test(
  "T7 returns a neutral zero-file Recovery inspection model",
  () => {
    const data =
      loadModule();

    const result =
      data
        .deriveTeacherRecoveryInspection();

    assert.equal(
      result.file.name,
      ""
    );

    assert.equal(
      result.file
        .size_bytes,
      null
    );

    assert.equal(
      result.file
        .within_size_limit,
      null
    );

    assert.equal(
      result.format
        .recognized,
      false
    );

    assert.equal(
      result.integrity
        .parse_ok,
      false
    );

    assert.equal(
      result.recovery
        .restorable,
      false
    );

    assert.equal(
      result.recovery
        .restore_location,
      "student_site"
    );

    assert.equal(
      result.message,
      "No backup is currently selected."
    );
  }
);

test(
  "T7 copies safe file-size state without inventing file contents",
  () => {
    const data =
      loadModule();

    const result =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "class-backup.json",
          file_size_bytes:
            1048576
        });

    assert.equal(
      result.file.name,
      "class-backup.json"
    );

    assert.equal(
      result.file
        .size_bytes,
      1048576
    );

    assert.equal(
      result.file
        .within_size_limit,
      true
    );

    assert.equal(
      "project"
        in result,
      false
    );
  }
);

test(
  "T7 enforces the exact 25 MiB inspection boundary",
  () => {
    const data =
      loadModule();

    const atLimit =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "limit.json",
          file_size_bytes:
            26214400
        });

    const overLimit =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "too-large.json",
          file_size_bytes:
            26214401
        });

    assert.equal(
      atLimit.file
        .within_size_limit,
      true
    );

    assert.equal(
      overLimit.file
        .within_size_limit,
      false
    );

    assert.equal(
      overLimit.message,
      "The selected file is too large for Teacher Workspace inspection."
    );
  }
);

test(
  "T7 maps a recognized version 2.0 full backup safely",
  () => {
    const data =
      loadModule();

    const result =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "project-full-backup.json",
          file_size_bytes:
            5000,
          parse_success:
            true,
          validator_available:
            true,
          validation_success:
            true,
          restorable:
            true,
          backup_mode:
            "full",
          legacy:
            false,
          packet_type:
            "rms_project_backup",
          packet_version:
            "2.0",
          created_at:
            "2026-09-17T05:00:00.000Z",
          baseline_id:
            "RMS-PILOT-BASELINE-v2.0",
          checksum_fingerprint:
            "abc123"
        });

    assert.equal(
      result.format
        .recognized,
      true
    );

    assert.equal(
      result.format
        .packet_type,
      "rms_project_backup"
    );

    assert.equal(
      result.format
        .version,
      "2.0"
    );

    assert.equal(
      result.format.mode,
      "full"
    );

    assert.equal(
      result.integrity
        .checksum_verified,
      true
    );

    assert.equal(
      result.recovery
        .restorable,
      true
    );

    assert.equal(
      result.message,
      "This backup is valid and can be restored through the student site."
    );
  }
);

test(
  "T7 maps a recognized version 2.0 privacy copy safely",
  () => {
    const data =
      loadModule();

    const result =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "privacy-copy.json",
          file_size_bytes:
            3000,
          parse_success:
            true,
          validator_available:
            true,
          validation_success:
            true,
          restorable:
            false,
          backup_mode:
            "privacy",
          packet_type:
            "rms_project_backup",
          packet_version:
            "2.0"
        });

    assert.equal(
      result.format.mode,
      "privacy"
    );

    assert.equal(
      result.integrity
        .checksum_verified,
      true
    );

    assert.equal(
      result.recovery
        .restorable,
      false
    );

    assert.equal(
      result.message,
      "This privacy-minimized copy is valid but cannot restore a complete project."
    );
  }
);

test(
  "T7 never makes a privacy copy restorable even when input claims restorable",
  () => {
    const data =
      loadModule();

    const result =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "privacy-copy.json",
          file_size_bytes:
            3000,
          parse_success:
            true,
          validator_available:
            true,
          validation_success:
            true,
          restorable:
            true,
          backup_mode:
            "privacy",
          packet_type:
            "rms_project_backup",
          packet_version:
            "2.0"
        });

    assert.equal(
      result.recovery
        .restorable,
      false
    );
  }
);

test(
  "T7 labels a recognized legacy backup without inventing version metadata",
  () => {
    const data =
      loadModule();

    const result =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "legacy-project.json",
          file_size_bytes:
            2000,
          parse_success:
            true,
          validator_available:
            true,
          validation_success:
            true,
          restorable:
            true,
          legacy:
            true
        });

    assert.equal(
      result.format
        .recognized,
      true
    );

    assert.equal(
      result.format.legacy,
      true
    );

    assert.equal(
      result.recovery
        .restorable,
      true
    );

    assert.equal(
      result.message,
      "This legacy backup is recognized and can be restored through the student site."
    );
  }
);

test(
  "T7 leaves legacy checksum verification unavailable",
  () => {
    const data =
      loadModule();

    const result =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "legacy.json",
          file_size_bytes:
            2000,
          parse_success:
            true,
          validator_available:
            true,
          validation_success:
            true,
          restorable:
            true,
          legacy:
            true,
          checksum_fingerprint:
            "should-not-create-verification"
        });

    assert.equal(
      result.integrity
        .checksum_verified,
      null
    );
  }
);

test(
  "T7 keeps malformed JSON non-restorable with a fixed safe message",
  () => {
    const data =
      loadModule();

    const result =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "broken.json",
          file_size_bytes:
            100,
          parse_success:
            false,
          validator_available:
            true,
          validation_success:
            false,
          validator_error:
            "C:\\private\\path\\secret.json"
        });

    assert.equal(
      result.recovery
        .restorable,
      false
    );

    assert.equal(
      result.message,
      "The selected file is not valid JSON."
    );

    assert.equal(
      result.message.includes(
        "private"
      ),
      false
    );
  }
);

test(
  "T7 keeps validator-unavailable inspection non-restorable",
  () => {
    const data =
      loadModule();

    const result =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "backup.json",
          file_size_bytes:
            1000,
          parse_success:
            true,
          validator_available:
            false,
          validation_success:
            true,
          restorable:
            true
        });

    assert.equal(
      result.recovery
        .restorable,
      false
    );

    assert.equal(
      result.message,
      "Recovery inspection is unavailable because the existing backup validator did not load."
    );
  }
);

test(
  "T7 reports failed version 2.0 validation as unverified checksum",
  () => {
    const data =
      loadModule();

    const result =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "corrupt.json",
          file_size_bytes:
            1000,
          parse_success:
            true,
          validator_available:
            true,
          validation_success:
            false,
          restorable:
            true,
          packet_type:
            "rms_project_backup",
          packet_version:
            "2.0"
        });

    assert.equal(
      result.integrity
        .checksum_verified,
      false
    );

    assert.equal(
      result.recovery
        .restorable,
      false
    );

    assert.equal(
      result.message,
      "The backup checksum could not be verified."
    );
  }
);

test(
  "T7 restore location is always the student site",
  () => {
    const data =
      loadModule();

    for (
      const input
      of [
        {},
        {
          file_name:
            "a.json"
        },
        {
          file_name:
            "b.json",
          parse_success:
            true,
          validator_available:
            true,
          validation_success:
            true,
          restorable:
            true
        }
      ]
    ) {
      assert.equal(
        data
          .deriveTeacherRecoveryInspection(
            input
          )
          .recovery
          .restore_location,
        "student_site"
      );
    }
  }
);

test(
  "T7 fixes every Recovery privacy exposure and access boundary to false",
  () => {
    const data =
      loadModule();

    const result =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "backup.json",
          file_size_bytes:
            1000,
          parse_success:
            true,
          validator_available:
            true,
          validation_success:
            true,
          restorable:
            true,
          project_contents_exposed:
            true,
          raw_data_exposed:
            true,
          manuscript_exposed:
            true,
          source_notes_exposed:
            true,
          chat_transcripts_exposed:
            true,
          live_student_storage_accessed:
            true,
          backup_uploaded:
            true
        });

    for (
      const key
      of [
        "project_contents_exposed",
        "raw_data_exposed",
        "manuscript_exposed",
        "source_notes_exposed",
        "chat_transcripts_exposed",
        "live_student_storage_accessed",
        "backup_uploaded"
      ]
    ) {
      assert.equal(
        result.privacy[key],
        false
      );
    }
  }
);

test(
  "T7 ignores arbitrary unapproved Recovery input fields",
  () => {
    const data =
      loadModule();

    const result =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "backup.json",
          file_size_bytes:
            100,
          arbitrary_secret:
            "do-not-copy",
          network:
            "upload",
          storage:
            "research_methods_studio_v1"
        });

    const serialized =
      JSON.stringify(
        result
      );

    assert.equal(
      serialized.includes(
        "do-not-copy"
      ),
      false
    );

    assert.equal(
      serialized.includes(
        "research_methods_studio_v1"
      ),
      false
    );

    assert.equal(
      "network"
        in result,
      false
    );

    assert.equal(
      "storage"
        in result,
      false
    );
  }
);

test(
  "T7 ignores project objects supplied as unapproved input",
  () => {
    const data =
      loadModule();

    const result =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "backup.json",
          file_size_bytes:
            100,
          project: {
            rawData: [
              {
                participant:
                  "SECRET-PARTICIPANT"
              }
            ],
            manuscript:
              "SECRET-MANUSCRIPT",
            notes:
              "SECRET-SOURCE-NOTE"
          }
        });

    const serialized =
      JSON.stringify(
        result
      );

    assert.equal(
      serialized.includes(
        "SECRET-PARTICIPANT"
      ),
      false
    );

    assert.equal(
      serialized.includes(
        "SECRET-MANUSCRIPT"
      ),
      false
    );

    assert.equal(
      serialized.includes(
        "SECRET-SOURCE-NOTE"
      ),
      false
    );
  }
);

test(
  "T7 Recovery inspection structures are recursively frozen at public boundaries",
  () => {
    const data =
      loadModule();

    const result =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "backup.json",
          file_size_bytes:
            100,
          parse_success:
            true,
          validator_available:
            true,
          validation_success:
            true,
          restorable:
            true
        });

    assert.equal(
      Object.isFrozen(
        result
      ),
      true
    );

    for (
      const key
      of [
        "file",
        "format",
        "integrity",
        "recovery",
        "privacy"
      ]
    ) {
      assert.equal(
        Object.isFrozen(
          result[key]
        ),
        true
      );
    }
  }
);

test(
  "T7 Recovery inspection derivation does not mutate its source input",
  () => {
    const data =
      loadModule();

    const input = {
      file_name:
        "backup.json",
      file_size_bytes:
        100,
      parse_success:
        true,
      validator_available:
        true,
      validation_success:
        true,
      restorable:
        true,
      backup_mode:
        "full",
      packet_type:
        "rms_project_backup",
      packet_version:
        "2.0",
      project: {
        hidden:
          "value"
      }
    };

    const before =
      JSON.stringify(
        input
      );

    data
      .deriveTeacherRecoveryInspection(
        input
      );

    assert.equal(
      JSON.stringify(
        input
      ),
      before
    );
  }
);

test(
  "T7 Recovery inspection derivation is deterministic",
  () => {
    const data =
      loadModule();

    const input = {
      file_name:
        "backup.json",
      file_size_bytes:
        100,
      parse_success:
        true,
      validator_available:
        true,
      validation_success:
        true,
      restorable:
        true,
      backup_mode:
        "full",
      packet_type:
        "rms_project_backup",
      packet_version:
        "2.0"
    };

    const first =
      JSON.stringify(
        data
          .deriveTeacherRecoveryInspection(
            input
          )
      );

    const second =
      JSON.stringify(
        data
          .deriveTeacherRecoveryInspection(
            input
          )
      );

    assert.equal(
      first,
      second
    );
  }
);

test(
  "T7 Recovery inspection remains browser storage packet and network independent",
  () => {
    const data =
      loadModule();

    const result =
      data
        .deriveTeacherRecoveryInspection({
          file_name:
            "backup.json",
          file_size_bytes:
            100,
          parse_success:
            true,
          validator_available:
            true,
          validation_success:
            true,
          restorable:
            true,
          localStorage: {
            secret:
              true
          },
          sessionStorage: {
            secret:
              true
          },
          packets: [
            "student"
          ],
          fetch:
            "network"
        });

    assert.deepEqual(
      Object.keys(
        result
      ),
      [
        "file",
        "format",
        "integrity",
        "recovery",
        "privacy",
        "message"
      ]
    );

    assert.equal(
      "localStorage"
        in result,
      false
    );

    assert.equal(
      "sessionStorage"
        in result,
      false
    );

    assert.equal(
      "packets"
        in result,
      false
    );

    assert.equal(
      "fetch"
        in result,
      false
    );
  }
);
