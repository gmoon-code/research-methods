window.RMSTeacherWorkspaceData = (() => {
  "use strict";

  const PACKET_TYPE =
    "rms_student_review";

  const PACKET_VERSION =
    "1.7";

  const VALIDATION_CODES =
    Object.freeze({
      PACKET_NOT_OBJECT:
        "packet_not_object",
      WRONG_PACKET_TYPE:
        "wrong_packet_type",
      WRONG_PACKET_VERSION:
        "wrong_packet_version",
      PROJECT_ID_REQUIRED:
        "project_id_required",
      MILESTONES_REQUIRED:
        "milestones_required",
      MILESTONE_NOT_OBJECT:
        "milestone_not_object",
      MILESTONE_ID_REQUIRED:
        "milestone_id_required",
      MILESTONE_STATE_TYPE:
        "milestone_state_type",
      MILESTONE_BLOCKERS_TYPE:
        "milestone_blockers_type",
      MILESTONE_WARNINGS_TYPE:
        "milestone_warnings_type",
      MILESTONE_CHECKPOINT_TYPE:
        "milestone_checkpoint_type",
      METHODS_TYPE:
        "methods_type",
      ANALYSIS_TYPE:
        "analysis_type",
      WRITING_TYPE:
        "writing_type",
      SOURCES_TYPE:
        "sources_type"
    });

  function isObject(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }

  function isUsableString(value) {
    return (
      typeof value === "string" &&
      value.trim().length > 0
    );
  }

  function cleanString(value) {
    return (
      typeof value === "string"
        ? value
        : ""
    );
  }

  function cleanStringArray(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      item =>
        typeof item === "string"
    );
  }

  function cleanBoolean(value) {
    return (
      typeof value === "boolean"
        ? value
        : null
    );
  }

  function cleanFiniteNumber(value) {
    return (
      typeof value === "number" &&
      Number.isFinite(value)
        ? value
        : null
    );
  }

  function validationError(
    code,
    message,
    path = ""
  ) {
    return Object.freeze({
      code,
      message,
      path
    });
  }

  function validateStudentPacket(packet) {
    const errors = [];

    if (!isObject(packet)) {
      errors.push(
        validationError(
          VALIDATION_CODES.PACKET_NOT_OBJECT,
          "The selected file does not contain a student review packet object."
        )
      );

      return Object.freeze({
        ok: false,
        errors: Object.freeze(errors)
      });
    }

    if (
      packet.packet_type !==
      PACKET_TYPE
    ) {
      errors.push(
        validationError(
          VALIDATION_CODES.WRONG_PACKET_TYPE,
          "The file is not an RMS student review packet.",
          "packet_type"
        )
      );
    }

    if (
      packet.version !==
      PACKET_VERSION
    ) {
      errors.push(
        validationError(
          VALIDATION_CODES.WRONG_PACKET_VERSION,
          "The review packet version is not supported by this Teacher Workspace.",
          "version"
        )
      );
    }

    if (
      !isUsableString(
        packet.project_id
      )
    ) {
      errors.push(
        validationError(
          VALIDATION_CODES.PROJECT_ID_REQUIRED,
          "The review packet is missing a usable project ID.",
          "project_id"
        )
      );
    }

    if (!Array.isArray(packet.milestones)) {
      errors.push(
        validationError(
          VALIDATION_CODES.MILESTONES_REQUIRED,
          "The review packet does not contain a valid milestone list.",
          "milestones"
        )
      );
    } else {
      packet.milestones.forEach(
        (milestone, index) => {
          const base =
            `milestones[${index}]`;

          if (!isObject(milestone)) {
            errors.push(
              validationError(
                VALIDATION_CODES.MILESTONE_NOT_OBJECT,
                "A milestone entry is not a valid object.",
                base
              )
            );

            return;
          }

          if (
            !isUsableString(
              milestone.id
            )
          ) {
            errors.push(
              validationError(
                VALIDATION_CODES.MILESTONE_ID_REQUIRED,
                "A milestone is missing a usable ID.",
                `${base}.id`
              )
            );
          }

          if (
            "state" in milestone &&
            typeof milestone.state !==
              "string"
          ) {
            errors.push(
              validationError(
                VALIDATION_CODES.MILESTONE_STATE_TYPE,
                "A milestone state must be text when provided.",
                `${base}.state`
              )
            );
          }

          if (
            "blockers" in milestone &&
            !Array.isArray(
              milestone.blockers
            )
          ) {
            errors.push(
              validationError(
                VALIDATION_CODES.MILESTONE_BLOCKERS_TYPE,
                "Milestone blockers must be a list when provided.",
                `${base}.blockers`
              )
            );
          }

          if (
            "warnings" in milestone &&
            !Array.isArray(
              milestone.warnings
            )
          ) {
            errors.push(
              validationError(
                VALIDATION_CODES.MILESTONE_WARNINGS_TYPE,
                "Milestone warnings must be a list when provided.",
                `${base}.warnings`
              )
            );
          }

          if (
            "checkpoint" in milestone &&
            !isObject(
              milestone.checkpoint
            )
          ) {
            errors.push(
              validationError(
                VALIDATION_CODES.MILESTONE_CHECKPOINT_TYPE,
                "A milestone checkpoint must be an object when provided.",
                `${base}.checkpoint`
              )
            );
          }
        }
      );
    }

    for (
      const [
        field,
        code,
        label
      ] of [
        [
          "methods",
          VALIDATION_CODES.METHODS_TYPE,
          "Methods summary"
        ],
        [
          "analysis",
          VALIDATION_CODES.ANALYSIS_TYPE,
          "Analysis summary"
        ],
        [
          "writing",
          VALIDATION_CODES.WRITING_TYPE,
          "Writing summary"
        ],
        [
          "sources",
          VALIDATION_CODES.SOURCES_TYPE,
          "Source summary"
        ]
      ]
    ) {
      if (
        field in packet &&
        !isObject(packet[field])
      ) {
        errors.push(
          validationError(
            code,
            `${label} must be an object when provided.`,
            field
          )
        );
      }
    }

    return Object.freeze({
      ok: errors.length === 0,
      errors: Object.freeze(errors)
    });
  }

  function normalizeCheckpoint(
    checkpoint
  ) {
    const source =
      isObject(checkpoint)
        ? checkpoint
        : {};

    return Object.freeze({
      status:
        cleanString(source.status),
      requestedAt:
        cleanString(
          source.requestedAt
        ),
      reviewedAt:
        cleanString(
          source.reviewedAt
        ),
      teacher:
        cleanString(source.teacher),
      comment:
        cleanString(source.comment),
      conditions:
        Object.freeze(
          cleanStringArray(
            source.conditions
          )
        )
    });
  }

  function normalizeMilestone(
    milestone
  ) {
    return Object.freeze({
      id:
        cleanString(
          milestone.id
        ).trim(),
      title:
        cleanString(
          milestone.title
        ),
      state:
        cleanString(
          milestone.state
        ),
      blockers:
        Object.freeze(
          cleanStringArray(
            milestone.blockers
          )
        ),
      warnings:
        Object.freeze(
          cleanStringArray(
            milestone.warnings
          )
        ),
      checkpoint:
        normalizeCheckpoint(
          milestone.checkpoint
        )
    });
  }

  function normalizeSources(
    sources
  ) {
    const source =
      isObject(sources)
        ? sources
        : {};

    return Object.freeze({
      total:
        cleanFiniteNumber(
          source.total
        ),
      included:
        cleanFiniteNumber(
          source.included
        ),
      verified:
        cleanFiniteNumber(
          source.verified
        ),
      themes:
        Object.freeze(
          cleanStringArray(
            source.themes
          )
        )
    });
  }

  function normalizeMethods(
    methods
  ) {
    const source =
      isObject(methods)
        ? methods
        : {};

    return Object.freeze({
      available:
        cleanBoolean(
          source.available
        ),
      score:
        cleanFiniteNumber(
          source.score
        ),
      label:
        cleanString(
          source.label
        ),
      critical:
        cleanFiniteNumber(
          source.critical
        ),
      warning:
        cleanFiniteNumber(
          source.warning
        ),
      ethicsStatus:
        cleanString(
          source.ethicsStatus
        ),
      locked:
        cleanBoolean(
          source.locked
        )
    });
  }

  function normalizeAnalysis(
    analysis
  ) {
    const source =
      isObject(analysis)
        ? analysis
        : {};

    return Object.freeze({
      dataset_file:
        cleanString(
          source.dataset_file
        ),
      imported_rows:
        cleanFiniteNumber(
          source.imported_rows
        ),
      stored_runs:
        cleanFiniteNumber(
          source.stored_runs
        ),
      primary_estimand:
        cleanString(
          source.primary_estimand
        ),
      primary_result:
        cleanString(
          source.primary_result
        )
    });
  }

  function normalizeWriting(
    writing
  ) {
    const source =
      isObject(writing)
        ? writing
        : {};

    const words =
      isObject(source.section_words)
        ? source.section_words
        : {};

    const sectionWords = {};

    for (
      const [key, value]
      of Object.entries(words)
    ) {
      if (
        typeof key === "string" &&
        Number.isFinite(value)
      ) {
        sectionWords[key] = value;
      }
    }

    const paperAudit =
      isObject(source.paper_audit)
        ? Object.freeze({
            available:
              cleanBoolean(
                source.paper_audit
                  .available
              ),
            score:
              cleanFiniteNumber(
                source.paper_audit
                  .score
              ),
            label:
              cleanString(
                source.paper_audit
                  .label
              )
          })
        : null;

    return Object.freeze({
      paper_audit:
        paperAudit,
      section_words:
        Object.freeze(
          sectionWords
        )
    });
  }

  function normalizeTeacherFeedback(
    feedback
  ) {
    if (!Array.isArray(feedback)) {
      return Object.freeze([]);
    }

    const normalized =
      feedback
        .filter(isObject)
        .map(item =>
          Object.freeze({
            milestone:
              cleanString(
                item.milestone
              ),
            stage:
              cleanString(
                item.stage
              ),
            comment:
              cleanString(
                item.comment
              ),
            message:
              cleanString(
                item.message
              ),
            createdAt:
              cleanString(
                item.createdAt
              ),
            importedAt:
              cleanString(
                item.importedAt
              )
          })
        );

    return Object.freeze(
      normalized
    );
  }

  function normalizeStageReady(
    stageReady
  ) {
    const source =
      isObject(stageReady)
        ? stageReady
        : {};

    const normalized = {};

    for (
      let stage = 1;
      stage <= 18;
      stage += 1
    ) {
      normalized[stage] =
        source[stage] === true ||
        source[String(stage)] ===
          true;
    }

    return Object.freeze(
      normalized
    );
  }

  function normalizeStudentPacket(
    packet
  ) {
    const validation =
      validateStudentPacket(
        packet
      );

    if (!validation.ok) {
      return Object.freeze({
        ok: false,
        errors:
          validation.errors,
        packet: null
      });
    }

    const normalized =
      Object.freeze({
        packet_type:
          PACKET_TYPE,
        version:
          PACKET_VERSION,
        exported_at:
          cleanString(
            packet.exported_at
          ),
        project_id:
          packet.project_id.trim(),
        student_alias:
          cleanString(
            packet.student_alias
          ),
        course_section:
          cleanString(
            packet.course_section
          ),
        project_name:
          cleanString(
            packet.project_name
          ),
        context:
          cleanString(
            packet.context
          ),
        research_question:
          cleanString(
            packet.research_question
          ),
        question_type:
          cleanString(
            packet.question_type
          ),
        design:
          cleanString(
            packet.design
          ),
        topic:
          cleanString(
            packet.topic
          ),
        stage_ready:
          normalizeStageReady(
            packet.stage_ready
          ),
        milestones:
          Object.freeze(
            packet.milestones.map(
              normalizeMilestone
            )
          ),
        sources:
          normalizeSources(
            packet.sources
          ),
        methods:
          normalizeMethods(
            packet.methods
          ),
        analysis:
          normalizeAnalysis(
            packet.analysis
          ),
        writing:
          normalizeWriting(
            packet.writing
          ),
        teacher_feedback:
          normalizeTeacherFeedback(
            packet.teacher_feedback
          )
      });

    return Object.freeze({
      ok: true,
      errors:
        Object.freeze([]),
      packet: normalized
    });
  }

  function normalizedPacketCollection(
    packets
  ) {
    if (!Array.isArray(packets)) {
      return [];
    }

    const byProjectId =
      new Map();

    packets.forEach(packet => {
      const result =
        normalizeStudentPacket(
          packet
        );

      if (!result.ok) {
        return;
      }

      byProjectId.set(
        result.packet.project_id,
        result.packet
      );
    });

    return Array.from(
      byProjectId.values()
    );
  }

  function upsertStudentPacket(
    packets,
    packet
  ) {
    const current =
      normalizedPacketCollection(
        packets
      );

    const candidate =
      normalizeStudentPacket(
        packet
      );

    if (!candidate.ok) {
      return Object.freeze({
        ok: false,
        replaced: false,
        index: -1,
        errors:
          candidate.errors,
        packets:
          Object.freeze(
            current
          )
      });
    }

    const next =
      current.slice();

    const index =
      next.findIndex(
        item =>
          item.project_id ===
          candidate.packet
            .project_id
      );

    const replaced =
      index >= 0;

    if (replaced) {
      next[index] =
        candidate.packet;
    } else {
      next.push(
        candidate.packet
      );
    }

    return Object.freeze({
      ok: true,
      replaced,
      index:
        replaced
          ? index
          : next.length - 1,
      errors:
        Object.freeze([]),
      packets:
        Object.freeze(next)
    });
  }

  function milestoneStateCount(
    packet,
    state
  ) {
    return packet.milestones
      .filter(
        milestone =>
          milestone.state === state
      )
      .length;
  }

  function projectHasBlockers(
    packet
  ) {
    return packet.milestones
      .some(
        milestone =>
          milestone.blockers
            .length > 0
      );
  }

  function deriveOverview(
    packets
  ) {
    const valid =
      normalizedPacketCollection(
        packets
      );

    let awaitingReviewCheckpoints =
      0;

    let revisionRequestCheckpoints =
      0;

    let projectsWithBlockers =
      0;

    let ethicsReviewProjects =
      0;

    let doNotFacilitateProjects =
      0;

    let lockedProtocols =
      0;

    let projectsWithStoredAnalysis =
      0;

    valid.forEach(packet => {
      awaitingReviewCheckpoints +=
        milestoneStateCount(
          packet,
          "awaiting_teacher"
        );

      revisionRequestCheckpoints +=
        milestoneStateCount(
          packet,
          "revision_requested"
        );

      if (
        projectHasBlockers(
          packet
        )
      ) {
        projectsWithBlockers +=
          1;
      }

      if (
        packet.methods
          .ethicsStatus ===
        "teacher_review"
      ) {
        ethicsReviewProjects +=
          1;
      }

      if (
        packet.methods
          .ethicsStatus ===
        "do_not_facilitate"
      ) {
        doNotFacilitateProjects +=
          1;
      }

      if (
        packet.methods.locked ===
        true
      ) {
        lockedProtocols +=
          1;
      }

      if (
        Number.isFinite(
          packet.analysis
            .stored_runs
        ) &&
        packet.analysis
          .stored_runs > 0
      ) {
        projectsWithStoredAnalysis +=
          1;
      }
    });

    return Object.freeze({
      importedProjects:
        valid.length,
      awaitingReviewCheckpoints,
      revisionRequestCheckpoints,
      projectsWithBlockers,
      ethicsReviewProjects,
      doNotFacilitateProjects,
      lockedProtocols,
      projectsWithStoredAnalysis
    });
  }

  function milestoneIdsForState(
    packet,
    state
  ) {
    return packet.milestones
      .filter(
        milestone =>
          milestone.state ===
          state
      )
      .map(
        milestone =>
          milestone.id
      );
  }

  function blockerSummary(
    packet
  ) {
    const blockers = [];

    packet.milestones
      .forEach(milestone => {
        milestone.blockers
          .forEach(blocker => {
            blockers.push({
              milestone:
                milestone.id,
              blocker
            });
          });
      });

    if (!blockers.length) {
      return null;
    }

    const first =
      blockers[0];

    const remaining =
      blockers.length - 1;

    const suffix =
      remaining > 0
        ? ` (+${remaining} more blocker${remaining === 1 ? "" : "s"})`
        : "";

    return (
      `${first.milestone}: ` +
      `${first.blocker}` +
      suffix
    );
  }

  function queueFlag(
    id,
    label,
    reason
  ) {
    return Object.freeze({
      id,
      label,
      reason
    });
  }

  function queueFlagsForPacket(
    packet
  ) {
    const flags = [];

    const awaiting =
      milestoneIdsForState(
        packet,
        "awaiting_teacher"
      );

    if (awaiting.length) {
      flags.push(
        queueFlag(
          "awaiting_review",
          "Awaiting review",
          `Awaiting teacher review at ${awaiting.join(", ")}.`
        )
      );
    }

    const revision =
      milestoneIdsForState(
        packet,
        "revision_requested"
      );

    if (revision.length) {
      flags.push(
        queueFlag(
          "revision_requested",
          "Revision requested",
          `Revision requested at ${revision.join(", ")}.`
        )
      );
    }

    if (
      packet.methods
        .ethicsStatus ===
      "teacher_review"
    ) {
      flags.push(
        queueFlag(
          "ethics_review",
          "Ethics review",
          "The packet reports teacher or institutional review as required."
        )
      );
    }

    if (
      packet.methods
        .ethicsStatus ===
      "do_not_facilitate"
    ) {
      flags.push(
        queueFlag(
          "do_not_facilitate",
          "Do not facilitate",
          "The packet diagnostic reports DO NOT FACILITATE. Teacher or institutional judgment remains separate."
        )
      );
    }

    const blocked =
      blockerSummary(
        packet
      );

    if (blocked) {
      flags.push(
        queueFlag(
          "blocked",
          "Blocked",
          blocked
        )
      );
    }

    if (!flags.length) {
      flags.push(
        queueFlag(
          "no_immediate_action",
          "No immediate teacher action",
          "No current T2 queue flag is reported in this packet. This does not mean the project is complete, correct, approved, or safe."
        )
      );
    }

    return Object.freeze(
      flags
    );
  }

  function compareDisplayValue(
    left,
    right
  ) {
    const a =
      cleanString(left)
        .trim()
        .toLowerCase();

    const b =
      cleanString(right)
        .trim()
        .toLowerCase();

    if (!a && b) {
      return 1;
    }

    if (a && !b) {
      return -1;
    }

    if (a < b) {
      return -1;
    }

    if (a > b) {
      return 1;
    }

    return 0;
  }

  function compareQueuePackets(
    left,
    right
  ) {
    for (
      const field
      of [
        "course_section",
        "student_alias",
        "project_name",
        "project_id"
      ]
    ) {
      const result =
        compareDisplayValue(
          left[field],
          right[field]
        );

      if (result !== 0) {
        return result;
      }
    }

    return 0;
  }

  function deriveReviewQueue(
    packets
  ) {
    const valid =
      normalizedPacketCollection(
        packets
      );

    valid.sort(
      compareQueuePackets
    );

    const rows =
      valid.map(packet =>
        Object.freeze({
          project_id:
            packet.project_id,
          student_alias:
            packet.student_alias,
          course_section:
            packet.course_section,
          project_name:
            packet.project_name,
          flags:
            queueFlagsForPacket(
              packet
            ),
          packet
        })
      );

    return Object.freeze(
      rows
    );
  }

  function inspectorStageProgress(
    stageReady
  ) {
    const stages = [];

    let readyCount = 0;

    for (
      let stage = 1;
      stage <= 18;
      stage += 1
    ) {
      const ready =
        stageReady[stage] ===
        true;

      if (ready) {
        readyCount += 1;
      }

      stages.push(
        Object.freeze({
          stage,
          ready,
          status:
            ready
              ? "ready"
              : "not_marked_ready"
        })
      );
    }

    return Object.freeze({
      ready_count:
        readyCount,
      total_stages:
        18,
      stages:
        Object.freeze(stages),
      interpretation:
        "Stage readiness is a read-only progress indicator and is not a grade."
    });
  }

  function inspectorMilestone(
    milestone
  ) {
    return Object.freeze({
      id:
        milestone.id,
      title:
        milestone.title,
      state:
        milestone.state,
      blockers:
        Object.freeze(
          Array.from(
            milestone.blockers
          )
        ),
      warnings:
        Object.freeze(
          Array.from(
            milestone.warnings
          )
        ),
      checkpoint:
        Object.freeze({
          status:
            milestone.checkpoint
              .status,
          requestedAt:
            milestone.checkpoint
              .requestedAt,
          reviewedAt:
            milestone.checkpoint
              .reviewedAt,
          teacher:
            milestone.checkpoint
              .teacher,
          comment:
            milestone.checkpoint
              .comment,
          conditions:
            Object.freeze(
              Array.from(
                milestone.checkpoint
                  .conditions
              )
            )
        })
    });
  }

  function inspectorTeacherFeedback(
    feedback
  ) {
    return Object.freeze(
      feedback.map(item =>
        Object.freeze({
          milestone:
            item.milestone,
          stage:
            item.stage,
          comment:
            item.comment,
          message:
            item.message,
          createdAt:
            item.createdAt,
          importedAt:
            item.importedAt
        })
      )
    );
  }

  function deriveStudentInspector(
    packet
  ) {
    const normalized =
      normalizeStudentPacket(
        packet
      );

    if (!normalized.ok) {
      return Object.freeze({
        ok: false,
        errors:
          normalized.errors,
        inspector: null
      });
    }

    const source =
      normalized.packet;

    const paperAudit =
      source.writing
        .paper_audit
        ? Object.freeze({
            available:
              source.writing
                .paper_audit
                .available,
            score:
              source.writing
                .paper_audit
                .score,
            label:
              source.writing
                .paper_audit
                .label
          })
        : null;

    const sectionWords =
      Object.freeze({
        ...source.writing
          .section_words
      });

    const inspector =
      Object.freeze({
        header:
          Object.freeze({
            student_alias:
              source.student_alias,
            project_id:
              source.project_id,
            course_section:
              source.course_section,
            project_name:
              source.project_name,
            exported_at:
              source.exported_at
          }),

        research:
          Object.freeze({
            context:
              source.context,
            topic:
              source.topic,
            research_question:
              source.research_question,
            question_type:
              source.question_type,
            design:
              source.design
          }),

        stage_progress:
          inspectorStageProgress(
            source.stage_ready
          ),

        milestones:
          Object.freeze(
            source.milestones.map(
              inspectorMilestone
            )
          ),

        sources:
          Object.freeze({
            total:
              source.sources.total,
            included:
              source.sources
                .included,
            verified:
              source.sources
                .verified,
            themes:
              Object.freeze(
                Array.from(
                  source.sources
                    .themes
                )
              ),
            notice:
              "Individual source records, source notes, and full source text are not included in this review packet."
          }),

        methods:
          Object.freeze({
            available:
              source.methods
                .available,
            score:
              source.methods.score,
            label:
              source.methods.label,
            critical:
              source.methods
                .critical,
            warning:
              source.methods
                .warning,
            ethicsStatus:
              source.methods
                .ethicsStatus,
            locked:
              source.methods.locked,
            kind:
              "packet_diagnostic",
            notice:
              "These values are packet diagnostics and remain separate from teacher judgment."
          }),

        analysis:
          Object.freeze({
            dataset_file:
              source.analysis
                .dataset_file,
            imported_rows:
              source.analysis
                .imported_rows,
            stored_runs:
              source.analysis
                .stored_runs,
            primary_estimand:
              source.analysis
                .primary_estimand,
            primary_result:
              source.analysis
                .primary_result,
            notice:
              "Raw dataset rows are not included in this review packet."
          }),

        writing:
          Object.freeze({
            paper_audit:
              paperAudit,
            section_words:
              sectionWords,
            notice:
              "Full paper text is not included in this review packet."
          }),

        teacher_feedback:
          Object.freeze({
            items:
              inspectorTeacherFeedback(
                source.teacher_feedback
              ),
            read_only:
              true,
            notice:
              "Existing teacher feedback is shown as read-only history in this Inspector."
          }),

        notices:
          Object.freeze({
            scope:
              "This Inspector is based on an exported review packet and does not contain all student work.",
            missing_data:
              "Missing optional values mean the information was not provided in this review packet.",
            stage_progress:
              "Stage readiness is a progress indicator and is not a grade.",
            methods:
              "Software-generated method diagnostics remain separate from teacher decisions."
          })
      });

    return Object.freeze({
      ok: true,
      errors:
        Object.freeze([]),
      inspector
    });
  }

  return Object.freeze({
    PACKET_TYPE,
    PACKET_VERSION,
    VALIDATION_CODES,
    validateStudentPacket,
    normalizeStudentPacket,
    upsertStudentPacket,
    deriveOverview,
    deriveReviewQueue,
    deriveStudentInspector
  });
})();
