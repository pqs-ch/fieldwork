class ExampleCatalogue
  Entry = Struct.new(:slug, :title, :kind, :purpose, :summary, :links, :steps, :review_cases, :shared, keyword_init: true) do
    def namespace = slug.tr('-', '_')
    def start_path = "/#{slug}#{links.first.last}"
  end

  EXAMPLES = [
    Entry.new(slug: 'application-layout', title: 'Application layout',
      kind: 'Layout study',
      purpose: 'Review navigation scope, page hierarchy and working width. The collections are read-only compositions; use Operations or Record activities to review completing business work.',
      summary: 'Top navigation, workspace navigation and read-only working views.',
      links: [['Top navigation', '/projects'], ['Workspace rail', '/workplace/requests']],
      steps: ['Open Projects and switch to People using the top navigation.', 'Open Workplace services and switch between requests, scheduled visits and equipment.', 'Use the keyboard to enter the main content and follow navigation links.'],
      review_cases: [
        ["Navigation scope", "Follow Projects → Workplace → Scheduled visits → Equipment → People → Your account. Workplace stays selected globally while its rail marks the exact local view."],
        ["Working width", "Compare the wide Projects table with the bounded account facts. Within Workplace, check that the rail leaves useful room for the work queue and its long subjects."],
        ["Keyboard and return", "Use Skip to content and Tab/Enter through both navigation levels. Follow a link, then Back and Forward: the selected area and page title should match the destination without automatically focusing the title or main region. Skip to content explicitly moves focus into the main region."]
      ]),
    Entry.new(slug: 'operations', title: 'Operations and tables',
      kind: 'Workflow reference',
      purpose: 'Review repeated collection work: find a project, update it, organize a personal task queue and complete work without losing your place.',
      summary: 'Connected collections, filtering, editing, saved views and work queues.',
      links: [['Projects', '/projects'], ['Saved work views', '/work']],
      steps: ['Filter projects by owner, budget and due date; sort and move between result pages.', 'Open a project, edit its details, discard a change and save another.', 'Open Saved work views, adjust a queue, save a personal view and complete a task.'],
      review_cases: [
        ["Owner search", "From starting data, search Owner for Sam and press Enter: three Sam Rivera projects appear. Search Jamie and Apply: Jamie replaces Sam. Search Alex with Add current selection to filter: Alex and Jamie are both included."],
        ["Scoped selection", "With Alex and Jamie selected, search am, enable Add current selection to filter and uncheck Jamie. Alex and Sam remain. Try Select all search results, a missing search value and Cancel; only matching choices should change."],
        ["Numeric and date filters", "Budget between 20000 and 30000 shows Customer onboarding and Workspace consolidation. Due date between 2026-11-01 and 2026-11-30 shows four projects. Reversed bounds should retain the entered range and explain the error."],
        ["Relative dates", "The fixed reference date is 12 November 2026 UTC. Tomorrow and This week show Workspace consolidation; This month shows four projects. Clear one filter, sort and change pages while retaining the other criteria."],
        ["Editing and conflicts", "Save a whitespace-only project name to check server errors. Open the same project editor in two tabs and save both: the older form retains its attempted values. Inspect the latest record separately before discarding or copying changes."],
        ["Saved work views", "In Saved work views, use the Work view picker for All open work, Overdue, Awaiting review or a personal view. Change filters and column layout, then choose View options → Save as… to name a personal view. View options → View settings contains its default, name, sharing and deletion settings. Save changes appears only for a modified personal view. Rename it while settings are modified; those settings should stay modified. Deleting a default opens a confirmation page and asks for its replacement. Share filters and sort in another browser session: personal names, defaults and columns stay private."],
        ["Queue recovery", "Open Review scenarios in the example review bar, fail the next view save and retry without losing the attempted name or settings. Open a task from a filtered or paged queue; validation, Cancel and completion should return to that context, with completed work removed from open scopes."]
      ], shared: true),
    Entry.new(slug: 'record-activities', title: 'Record activities',
      kind: 'Workflow reference',
      purpose: 'Review a complete service request from assessment to installation. Check how current facts, outstanding work and history support each next decision.',
      summary: 'One service request progressing through assessment, order and installation.',
      links: [['Service requests', '/requests'], ['First request', '/requests/2048'], ['Completed request', '/requests/2062']],
      steps: ['Open Reception display flickers and inspect its facts, activity and outstanding work.', 'Record an assessment with estimate 650 and findings explaining the fault. Record an order for Northline Office, reference PO-1094 and an expected date, then confirm installation and its test result.', 'Return to the record after each activity and inspect the resulting state and history.'],
      review_cases: [
        ["Recorded outcome", "After each activity, compare the recorded facts, newest-first history, next action and outstanding work. Long findings and outcomes should retain their paragraphs; history links back to those details. Open the completed starting record to review all stages without changing the first request. Record a progress note after completion: history grows while the request remains Completed."],
        ["Server validation", "Enter a positive estimate and findings containing only spaces. The server should retain all attempted answers and identify the invalid findings. Correct them and record the assessment."],
        ["Stale activity", "Open the same activity in two tabs. Record one, then submit different values from the other. The older form retains its answers, disables submission and links to the latest request in a new tab. Check what was recorded and choose an available activity there."],
        ["Protected exit", "Type into an activity and choose Cancel or Requests. Keep editing retains the text and returns focus. Repeat a complete save without JavaScript; forms, history and next-activity links still work."]
      ], shared: true),
    Entry.new(slug: 'population-review', title: 'Population reviews',
      kind: 'Workflow reference',
      purpose: 'Review a captured population, assess its records and attach evidence. Compare later changes without silently replacing the scope or facts already reviewed.',
      summary: 'Captured review scope, assessments, shared evidence and changed-fact comparisons.',
      links: [['Account reviews', '/reviews'], ['Evidence library', '/evidence'], ['Scenarios', '/scenarios']],
      steps: ['Start the service-account review and assess accounts independently.', 'Upload or reuse evidence, record a discrepancy and link a finding to its assessment.', 'Change source facts under Scenarios, compare against a recorded assessment, reassess and inspect completion readiness.'],
      review_cases: [
        ["Captured scope and filtered return", "Start the service-account review, then choose Add an account after capture in Scenarios. Its captured population and time stay fixed. Compact counts stay beside the account list; Review guidance and activity appear below the working content. Assess the last account in Outstanding: the empty view should offer Show all accounts and retain the applied view on return."],
        ["Findings and readiness", "Assess Deployment robot as Discrepancy found and record its finding, owner and plan. Exclude Retired reporting integration with an explanation. Inspect completion blockers before finishing the other accounts; completing checking leaves the finding open."],
        ["Evidence reuse", "Link service-account-export.csv to two accounts with different explanations and inspect Original and other uses. Upload up to five nonempty TXT, CSV or PDF files, at most 2 MB each, with source/date context. An assessment retains the evidence identity and explanation used at that time."],
        ["Remove versus withdraw", "Remove one account’s evidence link: the shared original, its other uses and earlier assessments remain. Withdraw the original from the Evidence library with a reason: downloads stop and unfinished assessments need reassessment. Open withdrawal in two tabs and change its uses before submitting to check scope-conflict recovery."],
        ["Historical comparison", "Assess Backup automation and open Compare with current. Use Change account comparison fields in Scenarios to review Changed, Added and Removed values; missing values, No and 0 stay distinct. Record another assessment and use Earlier assessments to revisit the first comparison URL: its assessment identity stays fixed. Account facts at review start exposes the separate captured basis."],
        ["Unavailable evidence and comparison", "Use Make shared export unavailable, or Make comparison unavailable, in Scenarios. Existing references retain honest availability, unavailable originals cannot be newly linked, and Retry comparison retains the recorded assessment identity."],
        ["Failed and stale saves", "Use Fail the next valid save before an assessment, finding, conclusion or evidence upload. Retry retains answers and selected files without duplicate results. Change an account’s owner in another tab before submitting an assessment: the old form retains its explanation, disables another save and opens comparison or recovery separately. A stale conclusion also requires a fresh form."],
        ["Empty population", "Start the satellite-office review and explain the independent evidence checked before completing it. An empty register alone does not explain coverage. Completed reviews remain read-only when later facts change."]
      ]),
    Entry.new(slug: 'mixed-forms', title: 'Mixed forms and selection',
      kind: 'Form study',
      purpose: 'Review one complex editor with repeated rows, record selection and files. It demonstrates editing and recovery rather than a project delivery lifecycle.',
      summary: 'Repeated deliverables, searchable record selection and files in one editor.',
      links: [['Project brief', '/mixed-form'], ['Native transport', '/mixed-form?transport=native']],
      steps: ['Change the owner and reviewers, add deliverables and require their dates.', 'Attach files with descriptions and edit the project name.', 'Save, make another change and discard it back to the saved baseline.'],
      review_cases: [
        ["Dynamic requirements", "Add a deliverable and require due dates. Clear its title or the reviewer selection, then save: the error summary should identify the affected row. Use a whitespace-only title to reach server validation. Changing the date requirement also updates added and restored rows."],
        ["Lookup recovery", "Select reviewers across searches, then search for failure. Selected reviewers remain visible through the failed lookup. Retry repeats the current search; the failure scenario keeps failing until you change the search. The single-owner picker commits one choice and closes."],
        ["Discard and file acknowledgement", "Choose files with descriptions, change rows and reviewers, then Discard. Keep editing preserves every value; confirming restores the saved rows and selections and clears unsaved files. Save another file and edit again: acknowledged files appear outside the new-file queue and are not uploaded again."],
        ["Draft row removal", "Enter in Project name or a deliverable title should validate and save. Remove a deliverable explicitly and cancel: all entries remain. Disable JavaScript to use the server confirmation page. Confirmation removes only that draft row; another tab still shows the saved brief until Save project. Focus moves to the next row, or Add when empty. Row actions do not consume the next-save failure scenario."],
        ["Native submission and return", "Open Native transport to use ordinary Turbo multipart submission, or disable JavaScript. Add and Remove change the draft without saving. Server round trips retain text and file descriptions and ask for file reselection; those notes survive further row actions and rejected saves. Enhanced Discard removes notes for the abandoned draft. Follow Workspace, Return to project brief and Back: authoritative saved values return without title autofocus. Server validation retains focus on its error summary."]
      ]),
    Entry.new(slug: 'purchase-request', title: 'Purchase requests',
      kind: 'Form study',
      purpose: 'Review precise value entry and totals before recording a purchase request. The supplier directory also contains a technical lab for element mounting and cleanup; it is not a purchasing workflow.',
      summary: 'Exact money, percentage, quantity and date-range entry with reviewed totals.',
      links: [['Purchase requests', '/purchases'], ['Supplier directory', '/suppliers']],
      steps: ['Start a purchase request and enter business values, units and an inclusive date range.', 'Review the calculated totals and return to correct the original values.', 'Confirm creation, then explore supplier lookups and return navigation.'],
      review_cases: [
        ["Raw values and precision", "Try price 1,234 in CHF, quantity 1e3, discount above 100 and a reversed delivery range. The summary links to each affected field, including without JavaScript, and rejected strings remain available for correction. Change price 125.50 from CHF to JPY: the amount stays unchanged and requires correction to whole yen."],
        ["Exact reviewed totals", "Set quantity to 1 item, price to CHF 0.05 and discount to 10%. The reviewed discount is CHF 0.01 and the total CHF 0.04. Try equal delivery dates: they count as one inclusive day. Change details should recover the original entered strings."],
        ["Failure and stale review", "Open one draft in two tabs and review different values. The older editor retains attempted values beside the saved draft and opens recovery separately; an older review cannot confirm changed details. Use Review scenarios above the reviewed request to fail confirmation once, retry and revisit confirmation: only one request is recorded."],
        ["Supplier lifecycle", "In the supplier directory, alternate Regional suppliers and All suppliers, then Refresh supplier contacts and Update reference contents. Keep the current reference on the next Frame response should leave its lookup usable. Search Slow and replace that reference while the lookup is pending, then navigate away and Back; enhancement should return once per lookup."]
      ]),
    Entry.new(slug: 'file-import', title: 'Supplier CSV imports',
      kind: 'Workflow reference',
      purpose: 'Review an import from source file to recorded row outcomes, including mapping, validation, partial acceptance and retry. Use the sample CSV to start the whole journey.',
      summary: 'Upload, map columns, validate rows, confirm results and retry failures.',
      links: [['Supplier imports', '/imports'], ['Sample CSV', '/imports/sample'], ['Native transport', '/imports/new?transport=native']],
      steps: ['Download the sample CSV and upload it as a new import.', 'Map Vendor ID, Company and Email to the supplier fields, then inspect validation results.', 'Choose all-or-nothing or valid-only acceptance and review the confirmed result.'],
      review_cases: [
        ["Mapping and sample outcomes", "Assign the same source column twice: both affected fields are identified, and the summary links back to them. Correct the mapping. The sample yields two ready rows, two source errors and two duplicate skips; compact row-problem links focus the affected row. Existing SUP-001 is unchanged and the second SUP-101 is skipped."],
        ["Strict and partial acceptance", "All or nothing refuses the sample while invalid rows remain. Open Review scenarios above the row check and choose Fail one ready row once. Select Import valid rows only: one ready row succeeds and the other can be retried without repeating that success. With a clean two-row CSV, All or nothing rolls back both on failure and imports both on retry."],
        ["Stale review and replay", "Open a mapping or check page in two tabs, then save a changed mapping in one. The older review cannot import it. Import an overlapping source in another tab to check revalidation against the changed register. Reload results or repeat a confirmation: supplier additions are not duplicated."],
        ["Upload recovery", "Try a malformed CSV, then drop a corrected replacement. Enhanced failure retains the live file. Use Native transport or disable JavaScript to check multipart upload, explicit file reselection after an error, mapping and confirmed results."]
      ]),
    Entry.new(slug: 'multi-step-creation', title: 'Multi-step creation',
      kind: 'Workflow reference',
      purpose: 'Review creating one request through saved draft steps, conditional questions, final review and confirmation. Return to earlier answers and recover from a rejected creation.',
      summary: 'Explicit draft saving, conditional answers, review, correction and creation.',
      links: [['Supplier-review requests', '/requests']],
      steps: ['Start a supplier-review request and save its details.', 'Complete the scope, leave and resume the saved draft.', 'Review the answers, return to correct one and confirm creation.'],
      review_cases: [
        ["Partial save and resume", "Try a future page before completing its prerequisites. Enter in Supplier name should validate and continue, not save and leave. Enter part of the scope and choose Save and go back, then return: incomplete answers remain. Save and leave accepts incomplete drafts; the draft list identifies the work to resume."],
        ["Conditional answers and correction", "Choose Independent assessment and supply its assessor. From checking, correct the supplier details and return directly to checking with other answers intact. Switch to Internal review: the earlier assessor is omitted from the check page and created request."],
        ["Competing drafts", "Save scope from two tabs with several paragraphs and different assessment approaches. The older editor preserves readable attempted and saved answers, showing the assessor only where applicable. Recovery opens the saved page separately. An older check page cannot create an obsolete revision."],
        ["Creation retry", "Use Review scenarios above the check page and choose Fail next creation once. Failure retains the reviewed answers; retry creates one request. Reopen the completed draft or repeat confirmation: both return the existing result. Creating the request does not start assessment work or send notifications."]
      ]),
    Entry.new(slug: 'draft-protection', title: 'Draft protection',
      kind: 'Interaction lab',
      purpose: 'Exercise unsaved-change decisions, pending navigation and retained files. Slow frames, failure controls and the browser reminder expose technical states; they are not a reference business screen.',
      summary: 'Protected navigation, file retention, pending saves and a browser reminder.',
      links: [['Workspace', '/workspace'], ['Project brief', '/workbench'], ['Native transport', '/workbench?transport=native']],
      steps: ['Edit the project brief and select a file, then follow Workspace and choose Keep editing.', 'Use Review controls to try Frame reloads and failed or slow saves; also try Back/Forward while editing.', 'Save a personal reminder, then revisit the editor and check its retained value.'],
      review_cases: [
        ["One exit decision", "Edit the brief and select a file, then try Workspace, Cancel, or the project search and review reload controls. Keep editing or Escape retains text and file contents and returns focus. Leave without saving performs the chosen navigation once. Reading brief guidance in its separate frame should not prompt."],
        ["Late response", "Under Review controls, start Load latest brief slowly while pristine, then type and choose a file before it finishes. Keep editing cancels replacement without losing the live form or leaving the request suspended."],
        ["Failed and pending saves", "Under Review controls, choose Service failure and save: text and file bytes remain for retry. Choose Slow save and try leaving: wait-for-result feedback appears while the save completes, with no discard decision. Choosing a synthetic outcome alone does not mark the brief as edited. Successful acknowledgement clears the new-file queue and explains that attachments are not stored."],
        ["History and unload", "Enter from Workspace, edit, then use Back and Forward. Keep editing retains the draft and address; Leave completes the traversal once. After interacting with the page, try reload or close to check the browser’s own warning."],
        ["Retained reminder and native transport", "Open and save a personal reminder, leave and return: the retained reminder should not produce a loss warning. Use Native transport, also with &drive=off, for repeated multipart saves; the transport choice remains after success and rejected file submissions request reselection. Native successes report actual received bytes and explain that files are discarded. With JavaScript disabled the reminder is hidden and the brief still saves on the server. Workspace shows its saved name and scope."]
      ]),
    Entry.new(slug: 'event-times', title: 'Event times and deadlines',
      kind: 'Form study',
      purpose: 'Review event entry when local times can be ambiguous or unavailable. Concentrate on timezone choices, validation and the final recorded instants.',
      summary: 'Local times, timezone choices, clock changes and reviewed UTC instants.',
      links: [['Event records', '/events'], ['Scenarios', '/scenarios']],
      steps: ['Enter an event using its local time, timezone and separate Review by calendar date.', 'Try Europe/Zurich at 2026-10-25 02:30 and explicitly choose which occurrence you mean.', 'Compare event time and follow-up target, revise a detail, then confirm and view the recorded event in another timezone.'],
      review_cases: [
        ["Repeated time", "Use 2026-10-25 02:30 in Europe/Zurich with Review by 2026-10-26. Neither occurrence is preselected. First occurrence is 00:30 UTC; second is 01:30 UTC. With the first, the four-elapsed-hour target is 04:30 UTC / 05:30 in Zürich."],
        ["Skipped and obsolete choices", "Try 2026-03-29 02:30 in Europe/Zurich: it does not exist and must remain available for correction to 03:30. After choosing a repeated occurrence, change the date to 2025-10-26 02:30; the old occurrence choice must be cleared before a fresh selection."],
        ["Midnight and timezone change", "Enter 2026-10-24 00:15 in Asia/Kolkata: the UTC instant is 23 October at 18:45. Revise the zone to UTC: entered clock fields stay 24 October, 00:15, and review resolves a different instant."],
        ["Confirmation freshness and retry", "Open a reviewed event in two tabs, revise and review different details in one, then confirm the older revision: it must not record. Open Review scenarios above the current review and choose Fail the next recording: setup returns to those exact values. Failure retains them for retry; revisiting a successful confirmation returns the same event."],
        ["Expired entry", "Keep a filled event form open and use Reset example… in another tab. Submitting the old form retains its attempted values, disables another review attempt and opens Start a fresh event in a separate tab. The attempted values remain available for reference."],
        ["Viewer and native behavior", "Inspect one saved event from browsers with different viewer timezones: its explicitly labeled zone, UTC values and Review by calendar date stay stable. Disable JavaScript and complete a skipped/repeated-time correction, review and recording."]
      ]),
    Entry.new(slug: 'versioned-documents', title: 'Versioned documents',
      kind: 'Workflow reference',
      purpose: 'Review a document through reading, editing, comparison and restoration. Check that recorded revisions remain distinct from the current draft and current published content.',
      summary: 'Read, edit, preview, compare and restore recorded document revisions.',
      links: [['Revision comparison', '/documents/example/compare?earlier=r2&later=r4'], ['Published document', '/documents/example/read'], ['Edit draft', '/documents/example/edit']],
      steps: ['Compare recorded revisions and expand unchanged sections for context.', 'Read the published document and distinguish it from the latest saved draft.', 'Edit and preview source, save a revision, inspect history and restore an earlier revision.'],
      review_cases: [
        ["Rendered unsaved preview", "In Edit draft, change three days to two days and preview: this known fixture renders the unsaved text. Try arbitrary Markdown too: the example labels and escapes it as source. Preview retains source and summary; further edits mark it out of date. Without JavaScript, unchanged text should still preview as saved. Enter in Change summary saves; Preview remains explicit."],
        ["Failed save and conflict recovery", "Save an empty change summary, then simulate a stale save. Both retain the attempted source. Inspect intervening changes in a new tab, explicitly save the submitted text against the newer revision, then Discard another edit back to that saved baseline."],
        ["Comparison states", "Open these review states directly. Source equality and metadata equality are separate, and an unavailable comparison must not claim no changes. In the main comparison, follow First change and Next change with the keyboard and expand unchanged context.", [
          ['Identical revisions', '/documents/example/compare?earlier=r3&later=r4'],
          ['First revision', '/documents/example/compare?later=r1'],
          ['Unavailable comparison', '/documents/example/compare?earlier=r2&later=r4&unavailable=1'],
          ['Unpublished document', '/documents/example/read?revision=r4&unpublished=1']
        ]],
        ["Publication and restoration", "Read publication 1.0/r1 and restore it into the draft from History. Restoration creates a new saved revision while the historical publication and current publication remain unchanged. Revisit a fixed comparison URL after saving: its revision pair stays fixed."]
      ], shared: true),
  ].freeze

  def self.find(slug) = EXAMPLES.find { |example| example.slug == slug }
end
