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

  const TEACHER_ANALYTICS_MILESTONE_IDS =
    Object.freeze([
      "M1",
      "M2",
      "M3",
      "M4",
      "M5"
    ]);

  const TEACHER_ANALYTICS_MILESTONE_STATES =
    Object.freeze([
      "blocked",
      "student_ready",
      "awaiting_teacher",
      "revision_requested",
      "approved",
      "complete"
    ]);

  function deterministicTextCompare(
    left,
    right
  ) {
    if (left < right) {
      return -1;
    }

    if (left > right) {
      return 1;
    }

    return 0;
  }

  function analyticsMilestoneState(
    packet,
    milestoneId
  ) {
    const matches =
      packet.milestones.filter(
        milestone =>
          milestone.id ===
          milestoneId
      );

    if (matches.length !== 1) {
      return "other_or_missing";
    }

    const state =
      matches[0].state;

    return TEACHER_ANALYTICS_MILESTONE_STATES
      .includes(state)
      ? state
      : "other_or_missing";
  }

  function analyticsProjectHasState(
    packet,
    state
  ) {
    return packet.milestones.some(
      milestone =>
        milestone.state ===
        state
    );
  }

  function deriveTeacherAnalytics(
    packets
  ) {
    const valid =
      normalizedPacketCollection(
        packets
      );

    const projectCount =
      valid.length;

    const stageReadiness = [];

    for (
      let stage = 1;
      stage <= 18;
      stage += 1
    ) {
      let readyProjects = 0;

      valid.forEach(packet => {
        if (
          packet.stage_ready[stage] ===
          true
        ) {
          readyProjects += 1;
        }
      });

      stageReadiness.push(
        Object.freeze({
          stage,
          ready_projects:
            readyProjects,
          project_count:
            projectCount
        })
      );
    }

    const milestoneStates =
      TEACHER_ANALYTICS_MILESTONE_IDS
        .map(milestoneId => {
          const counts = {
            blocked: 0,
            student_ready: 0,
            awaiting_teacher: 0,
            revision_requested: 0,
            approved: 0,
            complete: 0,
            other_or_missing: 0
          };

          valid.forEach(packet => {
            const state =
              analyticsMilestoneState(
                packet,
                milestoneId
              );

            counts[state] += 1;
          });

          return Object.freeze({
            milestone_id:
              milestoneId,
            blocked:
              counts.blocked,
            student_ready:
              counts.student_ready,
            awaiting_teacher:
              counts.awaiting_teacher,
            revision_requested:
              counts.revision_requested,
            approved:
              counts.approved,
            complete:
              counts.complete,
            other_or_missing:
              counts.other_or_missing,
            project_count:
              projectCount
          });
        });

    const workflowCounts =
      Object.freeze({
        projects_awaiting_teacher:
          valid.filter(
            packet =>
              analyticsProjectHasState(
                packet,
                "awaiting_teacher"
              )
          ).length,

        projects_revision_requested:
          valid.filter(
            packet =>
              analyticsProjectHasState(
                packet,
                "revision_requested"
              )
          ).length,

        projects_with_blockers:
          valid.filter(
            projectHasBlockers
          ).length,

        ethics_teacher_review:
          valid.filter(
            packet =>
              packet.methods
                .ethicsStatus ===
              "teacher_review"
          ).length,

        ethics_do_not_facilitate:
          valid.filter(
            packet =>
              packet.methods
                .ethicsStatus ===
              "do_not_facilitate"
          ).length,

        locked_protocols:
          valid.filter(
            packet =>
              packet.methods.locked ===
              true
          ).length,

        projects_with_stored_analysis:
          valid.filter(
            packet =>
              Number.isFinite(
                packet.analysis
                  .stored_runs
              ) &&
              packet.analysis
                .stored_runs > 0
          ).length
      });

    const sectionCounts =
      new Map();

    valid.forEach(packet => {
      const trimmed =
        packet.course_section.trim();

      const section =
        trimmed ||
        "Unspecified";

      sectionCounts.set(
        section,
        (
          sectionCounts.get(
            section
          ) ||
          0
        ) +
        1
      );
    });

    const courseSections =
      Array.from(
        sectionCounts.entries()
      )
        .sort(
          (
            [left],
            [right]
          ) =>
            deterministicTextCompare(
              left,
              right
            )
        )
        .map(
          (
            [
              courseSection,
              count
            ]
          ) =>
            Object.freeze({
              course_section:
                courseSection,
              project_count:
                count
            })
        );

    const literatureStatus =
      Object.freeze({
        projects_with_included_sources:
          valid.filter(
            packet =>
              Number.isFinite(
                packet.sources
                  .included
              ) &&
              packet.sources
                .included > 0
          ).length,

        projects_with_verified_sources:
          valid.filter(
            packet =>
              Number.isFinite(
                packet.sources
                  .verified
              ) &&
              packet.sources
                .verified > 0
          ).length
      });

    return Object.freeze({
      project_count:
        projectCount,

      stage_readiness:
        Object.freeze(
          stageReadiness
        ),

      milestone_states:
        Object.freeze(
          milestoneStates
        ),

      workflow_counts:
        workflowCounts,

      course_sections:
        Object.freeze(
          courseSections
        ),

      literature_status:
        literatureStatus
    });
  }

  function teacherChatEndpointOrigin(
    value
  ) {
    if (
      typeof value !== "string"
    ) {
      return "";
    }

    const text =
      value.trim();

    if (
      !text ||
      /\s/.test(text)
    ) {
      return "";
    }

    if (
      typeof URL === "function"
    ) {
      try {
        const parsed =
          new URL(text);

        if (
          (
            parsed.protocol !==
              "https:" &&
            parsed.protocol !==
              "http:"
          ) ||
          parsed.username ||
          parsed.password ||
          !parsed.hostname
        ) {
          return "";
        }

        return parsed.origin;
      } catch {
        return "";
      }
    }

    const match =
      text.match(
        /^(https?):\/\/([^/?#]+)(?:[/?#].*)?$/i
      );

    if (
      !match ||
      !match[2] ||
      match[2].includes("@")
    ) {
      return "";
    }

    const authority =
      match[2];

    const authorityMatch =
      authority.match(
        /^(\[[0-9a-f:.]+\]|[a-z0-9.-]+)(?::([0-9]{1,5}))?$/i
      );

    if (
      !authorityMatch
    ) {
      return "";
    }

    const portText =
      authorityMatch[2] || "";

    if (portText) {
      const port =
        Number(portText);

      if (
        !Number.isInteger(port) ||
        port < 1 ||
        port > 65535
      ) {
        return "";
      }
    }

    const protocol =
      match[1].toLowerCase();

    const host =
      authorityMatch[1]
        .toLowerCase();

    const defaultPort =
      (
        protocol === "https" &&
        portText === "443"
      ) ||
      (
        protocol === "http" &&
        portText === "80"
      );

    const port =
      portText &&
      !defaultPort
        ? `:${portText}`
        : "";

    return (
      `${protocol}://${host}${port}`
    );
  }

  function deriveTeacherChatControlsStatus(
    input = {}
  ) {
    const source =
      input &&
      typeof input === "object" &&
      !Array.isArray(input)
        ? input
        : {};

    const endpointOrigin =
      teacherChatEndpointOrigin(
        source
          .research_chat_endpoint
      );

    const service =
      Object.freeze({
        configured:
          endpointOrigin !== "",
        endpoint_origin:
          endpointOrigin,
        runtime_version:
          typeof source
            .runtime_version ===
              "string"
            ? source
                .runtime_version
                .trim()
            : "",
        free_edition:
          source.free_edition ===
          true
      });

    const teacherSession =
      Object.freeze({
        active:
          source
            .teacher_session_active ===
          true
      });

    const localPreview =
      Object.freeze({
        chat_enabled:
          source
            .local_chat_enabled ===
          true,
        class_code_present:
          source
            .class_chat_code_present ===
          true,
        scope:
          "browser_session_only"
      });

    const privacy =
      Object.freeze({
        transcripts_exposed:
          false,
        project_context_teacher_controlled:
          false,
        endpoint_teacher_editable:
          false,
        classwide_policy_available:
          false
      });

    return Object.freeze({
      service,
      teacher_session:
        teacherSession,
      local_preview:
        localPreview,
      privacy
    });
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


  const FEEDBACK_PACKET_TYPE =
    "rms_teacher_feedback";

  const FEEDBACK_PACKET_VERSION =
    "1.7";

  const REVIEW_DECISION_STATUSES =
    Object.freeze([
      "approved",
      "revision_requested"
    ]);

  function reviewObject(
    value
  ) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }

  function reviewErrorsResult(
    errors,
    extra = {}
  ) {
    return Object.freeze({
      ok:
        errors.length === 0,
      errors:
        Object.freeze(
          errors.slice()
        ),
      ...extra
    });
  }

  function freezeTeacherReviewDraft(
    draft
  ) {
    const checkpoints =
      Object.freeze(
        draft.checkpoints.map(
          item =>
            Object.freeze({
              id:
                item.id,
              status:
                item.status,
              comment:
                item.comment,
              conditions:
                Object.freeze(
                  item.conditions.slice()
                )
            })
        )
      );

    const feedback =
      Object.freeze(
        draft.feedback.map(
          item =>
            Object.freeze({
              milestone:
                item.milestone,
              stage:
                item.stage,
              comment:
                item.comment
            })
        )
      );

    return Object.freeze({
      project_id:
        draft.project_id,
      teacher:
        draft.teacher,
      checkpoints,
      feedback
    });
  }

  function knownReviewMilestones(
    studentPacket
  ) {
    return new Set(
      Array.isArray(
        studentPacket?.milestones
      )
        ? studentPacket.milestones
            .map(
              milestone =>
                typeof milestone?.id ===
                  "string"
                  ? milestone.id
                  : ""
            )
            .filter(Boolean)
        : []
    );
  }

  function validateReviewStudentPacket(
    studentPacket
  ) {
    const result =
      validateStudentPacket(
        studentPacket
      );

    return Boolean(
      result?.ok === true
    );
  }

  function createTeacherReviewDraft(
    studentPacket
  ) {
    if (
      !validateReviewStudentPacket(
        studentPacket
      )
    ) {
      return reviewErrorsResult(
        [
          "A valid rms_student_review version 1.7 packet is required."
        ],
        {
          draft: null
        }
      );
    }

    const projectId =
      typeof studentPacket.project_id ===
        "string"
        ? studentPacket.project_id
        : "";

    if (!projectId) {
      return reviewErrorsResult(
        [
          "The student review packet does not contain a project ID."
        ],
        {
          draft: null
        }
      );
    }

    return reviewErrorsResult(
      [],
      {
        draft:
          freezeTeacherReviewDraft({
            project_id:
              projectId,
            teacher:
              "",
            checkpoints:
              [],
            feedback:
              []
          })
      }
    );
  }

  function validateTeacherReviewDraft(
    studentPacket,
    draft
  ) {
    const errors = [];

    if (
      !validateReviewStudentPacket(
        studentPacket
      )
    ) {
      errors.push(
        "A valid rms_student_review version 1.7 packet is required."
      );

      return reviewErrorsResult(
        errors
      );
    }

    if (!reviewObject(draft)) {
      errors.push(
        "Teacher review draft must be an object."
      );

      return reviewErrorsResult(
        errors
      );
    }

    if (
      typeof draft.project_id !==
        "string" ||
      !draft.project_id ||
      draft.project_id !==
        studentPacket.project_id
    ) {
      errors.push(
        "Teacher review draft belongs to a different or unknown project."
      );
    }

    if (
      typeof draft.teacher !==
        "string"
    ) {
      errors.push(
        "Teacher display name must be text."
      );
    }

    const milestoneIds =
      knownReviewMilestones(
        studentPacket
      );

    if (
      !Array.isArray(
        draft.checkpoints
      )
    ) {
      errors.push(
        "Teacher review checkpoints must be an array."
      );
    } else {
      const seenIds =
        new Set();

      for (
        const item
        of draft.checkpoints
      ) {
        if (!reviewObject(item)) {
          errors.push(
            "Each checkpoint decision must be an object."
          );
          continue;
        }

        if (
          typeof item.id !==
            "string" ||
          !item.id ||
          !milestoneIds.has(
            item.id
          )
        ) {
          errors.push(
            "Checkpoint decision references an unknown checkpoint ID."
          );
        } else if (
          seenIds.has(
            item.id
          )
        ) {
          errors.push(
            "A checkpoint may have only one draft decision."
          );
        } else {
          seenIds.add(
            item.id
          );
        }

        if (
          !REVIEW_DECISION_STATUSES
            .includes(
              item.status
            )
        ) {
          errors.push(
            "Checkpoint decision status must be approved or revision_requested."
          );
        }

        if (
          typeof item.comment !==
            "string"
        ) {
          errors.push(
            "Checkpoint comment must be text."
          );
        }

        if (
          !Array.isArray(
            item.conditions
          )
        ) {
          errors.push(
            "Checkpoint conditions must be an array."
          );
        } else {
          for (
            const condition
            of item.conditions
          ) {
            if (
              typeof condition !==
                "string" ||
              !condition.trim()
            ) {
              errors.push(
                "Checkpoint conditions must contain meaningful teacher-authored text."
              );
            }
          }
        }
      }
    }

    if (
      !Array.isArray(
        draft.feedback
      )
    ) {
      errors.push(
        "Teacher feedback must be an array."
      );
    } else {
      for (
        const item
        of draft.feedback
      ) {
        if (!reviewObject(item)) {
          errors.push(
            "Each teacher feedback item must be an object."
          );
          continue;
        }

        if (
          typeof item.milestone !==
            "string"
        ) {
          errors.push(
            "Teacher feedback milestone must be text."
          );
        } else if (
          item.milestone &&
          !milestoneIds.has(
            item.milestone
          )
        ) {
          errors.push(
            "Teacher feedback references an unknown milestone ID."
          );
        }

        if (
          typeof item.stage !==
            "string"
        ) {
          errors.push(
            "Teacher feedback stage must be text."
          );
        }

        if (
          typeof item.comment !==
            "string" ||
          !item.comment.trim()
        ) {
          errors.push(
            "Teacher feedback requires a meaningful teacher-authored comment."
          );
        }
      }
    }

    return reviewErrorsResult(
      errors
    );
  }

  function setTeacherDisplayName(
    studentPacket,
    draft,
    teacher
  ) {
    const validation =
      validateTeacherReviewDraft(
        studentPacket,
        draft
      );

    if (!validation.ok) {
      return reviewErrorsResult(
        validation.errors,
        {
          draft: null
        }
      );
    }

    if (
      typeof teacher !==
        "string"
    ) {
      return reviewErrorsResult(
        [
          "Teacher display name must be text."
        ],
        {
          draft: null
        }
      );
    }

    return reviewErrorsResult(
      [],
      {
        draft:
          freezeTeacherReviewDraft({
            project_id:
              draft.project_id,
            teacher,
            checkpoints:
              draft.checkpoints,
            feedback:
              draft.feedback
          })
      }
    );
  }

  function upsertCheckpointDecision(
    studentPacket,
    draft,
    decision
  ) {
    const validation =
      validateTeacherReviewDraft(
        studentPacket,
        draft
      );

    if (!validation.ok) {
      return reviewErrorsResult(
        validation.errors,
        {
          draft: null
        }
      );
    }

    const errors = [];
    const milestoneIds =
      knownReviewMilestones(
        studentPacket
      );

    if (!reviewObject(decision)) {
      errors.push(
        "Checkpoint decision must be an object."
      );
    } else {
      if (
        typeof decision.id !==
          "string" ||
        !decision.id ||
        !milestoneIds.has(
          decision.id
        )
      ) {
        errors.push(
          "Checkpoint decision references an unknown checkpoint ID."
        );
      }

      if (
        !REVIEW_DECISION_STATUSES
          .includes(
            decision.status
          )
      ) {
        errors.push(
          "Checkpoint decision status must be approved or revision_requested."
        );
      }

      if (
        decision.comment !==
          undefined &&
        typeof decision.comment !==
          "string"
      ) {
        errors.push(
          "Checkpoint comment must be text."
        );
      }

      if (
        decision.conditions !==
          undefined &&
        !Array.isArray(
          decision.conditions
        )
      ) {
        errors.push(
          "Checkpoint conditions must be an array."
        );
      }

      if (
        Array.isArray(
          decision.conditions
        )
      ) {
        for (
          const condition
          of decision.conditions
        ) {
          if (
            typeof condition !==
              "string" ||
            !condition.trim()
          ) {
            errors.push(
              "Checkpoint conditions must contain meaningful teacher-authored text."
            );
          }
        }
      }
    }

    if (errors.length) {
      return reviewErrorsResult(
        errors,
        {
          draft: null
        }
      );
    }

    const normalized =
      Object.freeze({
        id:
          decision.id,
        status:
          decision.status,
        comment:
          decision.comment ??
          "",
        conditions:
          Object.freeze(
            (
              decision.conditions ??
              []
            ).slice()
          )
      });

    const checkpoints =
      draft.checkpoints.slice();

    const index =
      checkpoints.findIndex(
        item =>
          item.id ===
          normalized.id
      );

    if (index >= 0) {
      checkpoints[index] =
        normalized;
    } else {
      checkpoints.push(
        normalized
      );
    }

    return reviewErrorsResult(
      [],
      {
        draft:
          freezeTeacherReviewDraft({
            project_id:
              draft.project_id,
            teacher:
              draft.teacher,
            checkpoints,
            feedback:
              draft.feedback
          })
      }
    );
  }

  function upsertTeacherFeedback(
    studentPacket,
    draft,
    item,
    index = -1
  ) {
    const validation =
      validateTeacherReviewDraft(
        studentPacket,
        draft
      );

    if (!validation.ok) {
      return reviewErrorsResult(
        validation.errors,
        {
          draft: null
        }
      );
    }

    const errors = [];
    const milestoneIds =
      knownReviewMilestones(
        studentPacket
      );

    if (!reviewObject(item)) {
      errors.push(
        "Teacher feedback item must be an object."
      );
    } else {
      if (
        item.milestone !==
          undefined &&
        typeof item.milestone !==
          "string"
      ) {
        errors.push(
          "Teacher feedback milestone must be text."
        );
      } else if (
        item.milestone &&
        !milestoneIds.has(
          item.milestone
        )
      ) {
        errors.push(
          "Teacher feedback references an unknown milestone ID."
        );
      }

      if (
        item.stage !==
          undefined &&
        typeof item.stage !==
          "string" &&
        typeof item.stage !==
          "number"
      ) {
        errors.push(
          "Teacher feedback stage must be text or a number."
        );
      }

      if (
        typeof item.comment !==
          "string" ||
        !item.comment.trim()
      ) {
        errors.push(
          "Teacher feedback requires a meaningful teacher-authored comment."
        );
      }
    }

    if (
      !Number.isInteger(index) ||
      index < -1 ||
      index >=
        draft.feedback.length
    ) {
      errors.push(
        "Teacher feedback replacement index is invalid."
      );
    }

    if (errors.length) {
      return reviewErrorsResult(
        errors,
        {
          draft: null
        }
      );
    }

    const normalized =
      Object.freeze({
        milestone:
          item.milestone ??
          "",
        stage:
          item.stage ===
            undefined
            ? ""
            : String(
                item.stage
              ),
        comment:
          item.comment
      });

    const feedback =
      draft.feedback.slice();

    if (index === -1) {
      feedback.push(
        normalized
      );
    } else {
      feedback[index] =
        normalized;
    }

    return reviewErrorsResult(
      [],
      {
        draft:
          freezeTeacherReviewDraft({
            project_id:
              draft.project_id,
            teacher:
              draft.teacher,
            checkpoints:
              draft.checkpoints,
            feedback
          })
      }
    );
  }

  function hasExportableTeacherReview(
    draft
  ) {
    return Boolean(
      reviewObject(draft) &&
      Array.isArray(
        draft.checkpoints
      ) &&
      Array.isArray(
        draft.feedback
      ) &&
      (
        draft.checkpoints.length >
          0 ||
        draft.feedback.length >
          0
      )
    );
  }

  function reviewExportTimestamp(
    value
  ) {
    const candidate =
      value === undefined
        ? new Date()
            .toISOString()
        : value;

    if (
      typeof candidate !==
        "string"
    ) {
      return "";
    }

    const parsed =
      Date.parse(
        candidate
      );

    if (
      !Number.isFinite(
        parsed
      )
    ) {
      return "";
    }

    return new Date(
      parsed
    ).toISOString();
  }

  function buildTeacherFeedbackPacket(
    studentPacket,
    draft,
    createdAt
  ) {
    const validation =
      validateTeacherReviewDraft(
        studentPacket,
        draft
      );

    if (!validation.ok) {
      return reviewErrorsResult(
        validation.errors,
        {
          packet: null
        }
      );
    }

    if (
      !hasExportableTeacherReview(
        draft
      )
    ) {
      return reviewErrorsResult(
        [
          "Teacher review contains no checkpoint decision or teacher feedback to export."
        ],
        {
          packet: null
        }
      );
    }

    const timestamp =
      reviewExportTimestamp(
        createdAt
      );

    if (!timestamp) {
      return reviewErrorsResult(
        [
          "Feedback export requires a valid ISO-8601 timestamp."
        ],
        {
          packet: null
        }
      );
    }

    const checkpoints =
      Object.freeze(
        draft.checkpoints.map(
          item =>
            Object.freeze({
              id:
                item.id,
              status:
                item.status,
              reviewedAt:
                timestamp,
              teacher:
                draft.teacher,
              comment:
                item.comment,
              conditions:
                Object.freeze(
                  item.conditions.slice()
                )
            })
        )
      );

    const feedback =
      Object.freeze(
        draft.feedback.map(
          item =>
            Object.freeze({
              milestone:
                item.milestone,
              stage:
                item.stage,
              comment:
                item.comment,
              createdAt:
                timestamp
            })
        )
      );

    const packet =
      Object.freeze({
        packet_type:
          FEEDBACK_PACKET_TYPE,
        version:
          FEEDBACK_PACKET_VERSION,
        created_at:
          timestamp,
        project_id:
          studentPacket.project_id,
        student_alias:
          typeof studentPacket
            .student_alias ===
            "string"
            ? studentPacket
                .student_alias
            : "",
        checkpoints,
        feedback,
        competency_ratings:
          Object.freeze([])
      });

    return reviewErrorsResult(
      [],
      {
        packet
      }
    );
  }


  const ASSIGNMENT_PACKET_TYPE =
    "rms_assignment_setup";

  const ASSIGNMENT_PACKET_VERSION =
    "1.0";

  const ASSIGNMENT_MILESTONE_IDS =
    Object.freeze([
      "M1",
      "M2",
      "M3",
      "M4",
      "M5"
    ]);

  const ASSIGNMENT_TEXT_FIELDS =
    Object.freeze([
      "assignment_id",
      "title",
      "course_section",
      "teacher_display_name",
      "student_instructions",
      "teacher_notes"
    ]);

  const ASSIGNMENT_DRAFT_FIELDS =
    Object.freeze([
      ...ASSIGNMENT_TEXT_FIELDS,
      "milestone_due_dates"
    ]);

  const ASSIGNMENT_PACKET_FIELDS =
    Object.freeze([
      "packet_type",
      "version",
      "created_at",
      ...ASSIGNMENT_DRAFT_FIELDS
    ]);

  function assignmentObject(
    value
  ) {
    return Boolean(
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    );
  }

  function assignmentResult(
    errors,
    extra = {}
  ) {
    return Object.freeze({
      ok:
        errors.length === 0,
      errors:
        Object.freeze(
          errors.slice()
        ),
      ...extra
    });
  }

  function assignmentHasOwn(
    value,
    key
  ) {
    return Object.prototype
      .hasOwnProperty
      .call(
        value,
        key
      );
  }

  function assignmentExactKeysErrors(
    value,
    expected,
    label
  ) {
    const errors = [];

    if (!assignmentObject(value)) {
      return [
        `${label} must be an object.`
      ];
    }

    const actual =
      Object.keys(value);

    for (
      const key
      of expected
    ) {
      if (
        !assignmentHasOwn(
          value,
          key
        )
      ) {
        errors.push(
          `${label} is missing ${key}.`
        );
      }
    }

    for (
      const key
      of actual
    ) {
      if (
        !expected.includes(
          key
        )
      ) {
        errors.push(
          `${label} contains unsupported field ${key}.`
        );
      }
    }

    return errors;
  }

  function validAssignmentDate(
    value
  ) {
    if (value === "") {
      return true;
    }

    if (
      typeof value !==
        "string"
    ) {
      return false;
    }

    const match =
      /^(\d{4})-(\d{2})-(\d{2})$/
        .exec(value);

    if (!match) {
      return false;
    }

    const year =
      Number(match[1]);

    const month =
      Number(match[2]);

    const day =
      Number(match[3]);

    if (
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return false;
    }

    const date =
      new Date(0);

    date.setUTCHours(
      0,
      0,
      0,
      0
    );

    date.setUTCFullYear(
      year,
      month - 1,
      day
    );

    return (
      date.getUTCFullYear() ===
        year &&
      date.getUTCMonth() ===
        month - 1 &&
      date.getUTCDate() ===
        day
    );
  }

  function validAssignmentTimestamp(
    value
  ) {
    if (
      typeof value !==
        "string" ||
      !value.includes("T")
    ) {
      return false;
    }

    const parsed =
      Date.parse(value);

    return Number.isFinite(
      parsed
    );
  }

  function freezeAssignmentDueDates(
    source
  ) {
    const input =
      assignmentObject(source)
        ? source
        : {};

    const dueDates = {};

    for (
      const milestoneId
      of ASSIGNMENT_MILESTONE_IDS
    ) {
      dueDates[milestoneId] =
        typeof input[
          milestoneId
        ] === "string"
          ? input[
              milestoneId
            ]
          : "";
    }

    return Object.freeze(
      dueDates
    );
  }

  function freezeAssignmentDraft(
    source
  ) {
    return Object.freeze({
      assignment_id:
        source.assignment_id,
      title:
        source.title,
      course_section:
        source.course_section,
      teacher_display_name:
        source.teacher_display_name,
      student_instructions:
        source.student_instructions,
      teacher_notes:
        source.teacher_notes,
      milestone_due_dates:
        freezeAssignmentDueDates(
          source
            .milestone_due_dates
        )
    });
  }

  function assignmentDraftErrors(
    draft,
    requireIdentity = true
  ) {
    const errors =
      assignmentExactKeysErrors(
        draft,
        ASSIGNMENT_DRAFT_FIELDS,
        "Assignment draft"
      );

    if (
      !assignmentObject(draft)
    ) {
      return errors;
    }

    for (
      const field
      of ASSIGNMENT_TEXT_FIELDS
    ) {
      if (
        typeof draft[field] !==
          "string"
      ) {
        errors.push(
          `${field} must be text.`
        );
      }
    }

    if (
      requireIdentity &&
      typeof draft.assignment_id ===
        "string" &&
      !draft.assignment_id.trim()
    ) {
      errors.push(
        "assignment_id is required."
      );
    }

    if (
      requireIdentity &&
      typeof draft.title ===
        "string" &&
      !draft.title.trim()
    ) {
      errors.push(
        "title is required."
      );
    }

    if (
      !assignmentObject(
        draft.milestone_due_dates
      )
    ) {
      errors.push(
        "milestone_due_dates must be an object."
      );

      return errors;
    }

    for (
      const key
      of Object.keys(
        draft.milestone_due_dates
      )
    ) {
      if (
        !ASSIGNMENT_MILESTONE_IDS
          .includes(key)
      ) {
        errors.push(
          `Unknown milestone due-date key ${key}.`
        );
      }
    }

    for (
      const milestoneId
      of ASSIGNMENT_MILESTONE_IDS
    ) {
      if (
        !assignmentHasOwn(
          draft.milestone_due_dates,
          milestoneId
        )
      ) {
        errors.push(
          `milestone_due_dates is missing ${milestoneId}.`
        );

        continue;
      }

      const value =
        draft
          .milestone_due_dates[
            milestoneId
          ];

      if (
        typeof value !==
          "string"
      ) {
        errors.push(
          `${milestoneId} due date must be text.`
        );

        continue;
      }

      if (
        !validAssignmentDate(
          value
        )
      ) {
        errors.push(
          `${milestoneId} due date must be empty or YYYY-MM-DD.`
        );
      }
    }

    return errors;
  }

  function createAssignmentDraft() {
    const draft =
      freezeAssignmentDraft({
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
        milestone_due_dates:
          Object.fromEntries(
            ASSIGNMENT_MILESTONE_IDS
              .map(
                milestoneId => [
                  milestoneId,
                  ""
                ]
              )
          )
      });

    return assignmentResult(
      [],
      {
        draft
      }
    );
  }

  function validateAssignmentDraft(
    draft
  ) {
    return assignmentResult(
      assignmentDraftErrors(
        draft,
        true
      )
    );
  }

  function updateAssignmentField(
    draft,
    field,
    value
  ) {
    const structuralErrors =
      assignmentDraftErrors(
        draft,
        false
      );

    if (
      structuralErrors.length
    ) {
      return assignmentResult(
        structuralErrors,
        {
          draft: null
        }
      );
    }

    if (
      !ASSIGNMENT_TEXT_FIELDS
        .includes(field)
    ) {
      return assignmentResult(
        [
          `Unsupported assignment field ${field}.`
        ],
        {
          draft: null
        }
      );
    }

    if (
      typeof value !==
        "string"
    ) {
      return assignmentResult(
        [
          `${field} must be text.`
        ],
        {
          draft: null
        }
      );
    }

    const next =
      freezeAssignmentDraft({
        ...draft,
        [field]:
          value
      });

    return assignmentResult(
      [],
      {
        draft:
          next
      }
    );
  }

  function updateAssignmentMilestoneDueDate(
    draft,
    milestoneId,
    value
  ) {
    const structuralErrors =
      assignmentDraftErrors(
        draft,
        false
      );

    if (
      structuralErrors.length
    ) {
      return assignmentResult(
        structuralErrors,
        {
          draft: null
        }
      );
    }

    if (
      !ASSIGNMENT_MILESTONE_IDS
        .includes(
          milestoneId
        )
    ) {
      return assignmentResult(
        [
          `Unknown assignment milestone ${milestoneId}.`
        ],
        {
          draft: null
        }
      );
    }

    if (
      typeof value !==
        "string" ||
      !validAssignmentDate(
        value
      )
    ) {
      return assignmentResult(
        [
          `${milestoneId} due date must be empty or YYYY-MM-DD.`
        ],
        {
          draft: null
        }
      );
    }

    const dueDates = {
      ...draft
        .milestone_due_dates,
      [milestoneId]:
        value
    };

    const next =
      freezeAssignmentDraft({
        ...draft,
        milestone_due_dates:
          dueDates
      });

    return assignmentResult(
      [],
      {
        draft:
          next
      }
    );
  }

  function validateAssignmentPacket(
    packet
  ) {
    const errors =
      assignmentExactKeysErrors(
        packet,
        ASSIGNMENT_PACKET_FIELDS,
        "Assignment packet"
      );

    if (
      !assignmentObject(packet)
    ) {
      return assignmentResult(
        errors
      );
    }

    if (
      packet.packet_type !==
        ASSIGNMENT_PACKET_TYPE
    ) {
      errors.push(
        "The file is not an RMS assignment setup packet."
      );
    }

    if (
      packet.version !==
        ASSIGNMENT_PACKET_VERSION
    ) {
      errors.push(
        "The assignment setup packet version is not supported."
      );
    }

    if (
      !validAssignmentTimestamp(
        packet.created_at
      )
    ) {
      errors.push(
        "created_at must be a valid ISO-8601 timestamp."
      );
    }

    const draft = {
      assignment_id:
        packet.assignment_id,
      title:
        packet.title,
      course_section:
        packet.course_section,
      teacher_display_name:
        packet.teacher_display_name,
      student_instructions:
        packet.student_instructions,
      teacher_notes:
        packet.teacher_notes,
      milestone_due_dates:
        packet.milestone_due_dates
    };

    errors.push(
      ...assignmentDraftErrors(
        draft,
        true
      )
    );

    return assignmentResult(
      errors
    );
  }

  function normalizeAssignmentPacket(
    packet
  ) {
    const validation =
      validateAssignmentPacket(
        packet
      );

    if (!validation.ok) {
      return assignmentResult(
        validation.errors,
        {
          packet: null
        }
      );
    }

    const normalized =
      Object.freeze({
        packet_type:
          ASSIGNMENT_PACKET_TYPE,
        version:
          ASSIGNMENT_PACKET_VERSION,
        created_at:
          packet.created_at,
        assignment_id:
          packet.assignment_id,
        title:
          packet.title,
        course_section:
          packet.course_section,
        teacher_display_name:
          packet.teacher_display_name,
        student_instructions:
          packet.student_instructions,
        teacher_notes:
          packet.teacher_notes,
        milestone_due_dates:
          freezeAssignmentDueDates(
            packet
              .milestone_due_dates
          )
      });

    return assignmentResult(
      [],
      {
        packet:
          normalized
      }
    );
  }

  function assignmentDraftFromPacket(
    packet
  ) {
    const normalized =
      normalizeAssignmentPacket(
        packet
      );

    if (!normalized.ok) {
      return assignmentResult(
        normalized.errors,
        {
          draft: null
        }
      );
    }

    const source =
      normalized.packet;

    const draft =
      freezeAssignmentDraft({
        assignment_id:
          source.assignment_id,
        title:
          source.title,
        course_section:
          source.course_section,
        teacher_display_name:
          source.teacher_display_name,
        student_instructions:
          source.student_instructions,
        teacher_notes:
          source.teacher_notes,
        milestone_due_dates:
          source
            .milestone_due_dates
      });

    return assignmentResult(
      [],
      {
        draft
      }
    );
  }

  function assignmentExportTimestamp(
    createdAt
  ) {
    if (
      createdAt ===
        undefined
    ) {
      return new Date()
        .toISOString();
    }

    if (
      !validAssignmentTimestamp(
        createdAt
      )
    ) {
      return "";
    }

    return new Date(
      Date.parse(
        createdAt
      )
    ).toISOString();
  }

  function buildAssignmentPacket(
    draft,
    createdAt
  ) {
    const validation =
      validateAssignmentDraft(
        draft
      );

    if (!validation.ok) {
      return assignmentResult(
        validation.errors,
        {
          packet: null
        }
      );
    }

    const timestamp =
      assignmentExportTimestamp(
        createdAt
      );

    if (!timestamp) {
      return assignmentResult(
        [
          "A valid export timestamp is required."
        ],
        {
          packet: null
        }
      );
    }

    const packet =
      Object.freeze({
        packet_type:
          ASSIGNMENT_PACKET_TYPE,
        version:
          ASSIGNMENT_PACKET_VERSION,
        created_at:
          timestamp,
        assignment_id:
          draft.assignment_id,
        title:
          draft.title,
        course_section:
          draft.course_section,
        teacher_display_name:
          draft.teacher_display_name,
        student_instructions:
          draft.student_instructions,
        teacher_notes:
          draft.teacher_notes,
        milestone_due_dates:
          freezeAssignmentDueDates(
            draft
              .milestone_due_dates
          )
      });

    return assignmentResult(
      [],
      {
        packet
      }
    );
  }

  return Object.freeze({
    PACKET_TYPE,
    PACKET_VERSION,
    VALIDATION_CODES,
    FEEDBACK_PACKET_TYPE,
    FEEDBACK_PACKET_VERSION,
    REVIEW_DECISION_STATUSES,
    ASSIGNMENT_PACKET_TYPE,
    ASSIGNMENT_PACKET_VERSION,
    ASSIGNMENT_MILESTONE_IDS,
    validateStudentPacket,
    normalizeStudentPacket,
    upsertStudentPacket,
    deriveOverview,
    deriveReviewQueue,
    deriveStudentInspector,
    deriveTeacherAnalytics,
    deriveTeacherChatControlsStatus,
    createTeacherReviewDraft,
    validateTeacherReviewDraft,
    setTeacherDisplayName,
    upsertCheckpointDecision,
    upsertTeacherFeedback,
    hasExportableTeacherReview,
    buildTeacherFeedbackPacket,
    createAssignmentDraft,
    validateAssignmentDraft,
    updateAssignmentField,
    updateAssignmentMilestoneDueDate,
    validateAssignmentPacket,
    normalizeAssignmentPacket,
    assignmentDraftFromPacket,
    buildAssignmentPacket
  });
})();
