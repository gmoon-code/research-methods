# Teacher Review Round-Trip Rehearsal v2.13.2

Complete this before the first real novice session.

## A. Student-side preparation

1. Create a temporary project.
2. Enter enough sample work to generate a review packet.
3. Create a full backup.
4. Record the backup filename and time.
5. Export the student review packet.

Pass when the file downloads, the project remains usable, and no raw dataset or full manuscript is unexpectedly included in the minimized review packet.

## B. Teacher Dashboard

1. Open Teacher Dashboard.
2. Import the student review packet.
3. Confirm the correct project appears once.
4. Import the same packet again.
5. Confirm it replaces/upserts the project record rather than creating a duplicate.
6. Open the review.
7. Enter feedback.
8. Export feedback JSON.

Pass when project counts are not inflated, feedback is attached to the intended project, and the teacher can identify the milestone/stage requiring revision.

## C. Student feedback import

1. Return to the student project.
2. Import teacher feedback.
3. Confirm the feedback is visible.
4. Confirm the student's earlier work remains present.
5. Confirm revision does not erase support/revision history.

## D. Backup / restore

1. Make one visible change after creating the backup.
2. Restore the earlier full backup.
3. Confirm the restored state matches the backup point.
4. Confirm a privacy-minimized copy is rejected as a restore source.

## E. Recovery failure rehearsal

Simulate one case without using real student work.

- browser storage unavailable
- accidental reload before expected save
- attempted restore with wrong file
- attempted import of a teacher packet into the student restore control

Record the exact recovery steps the teacher would use during class.

## Teacher burden measures

Record total minutes for the full round trip, downloads, uploads/imports, instruction lookups, filename ambiguity, project-identity uncertainty, privacy concerns, and any step the teacher would not want to repeat for 20+ students.

The pilot should not proceed broadly if the workflow is technically functional but operationally unrealistic for the intended class size.
