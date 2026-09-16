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

  return Object.freeze({
    PACKET_TYPE,
    PACKET_VERSION,
    VALIDATION_CODES,
    validateStudentPacket,
    normalizeStudentPacket
  });
})();
