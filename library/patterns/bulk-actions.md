# Pattern: acting on several records

## Recommended default

Use this pattern when one operation affects several selected records. Keep the selection, available operations, and affected scope understandable throughout the task. For table selections, use the [row-selection element](../elements/row-selection.md) for controls, selection state, and lifecycle.

## Select and choose an operation

Show which records are selected and provide a clear way to clear the selection. Distinguish selection on the visible page from all matching records; moving between pages must not silently widen the operation's scope.

Keep frequent operations directly available. Use [action dropdowns](../elements/action-dropdowns.md#action-dropdowns) for secondary operations, keeping the count and scope visible. Record links remain usable independently of selection. Offer only operations the application supports for the selection.

## Review and commit

Before committing, make the operation, its parameters, and affected scope clear. Use a review step when users need to supply shared values or understand material consequences. Simple, low-consequence operations can run directly from a clearly labeled action. Deletion follows the [deletion-confirmation contract](../elements/deletion-confirmation.md).

Capture the selection and operation together when submitted. The application validates eligibility and permissions and handles changes since review. If the affected scope has changed, explain what needs review rather than silently acting on a broader or different set.

## Pending work and outcomes

Show progress and prevent conflicting changes while the operation is pending. Keep the selected scope and entered parameters available after a failure so users can recover without reconstructing their choices.

Report confirmed outcomes for the submitted scope. Distinguish completed, unsuccessful, and unresolved work; reconcile an uncertain result before retrying. Preserve successful work when retrying a failed subset. Use [long-running actions](long-running-actions.md) for queued work or operations that continue beyond the request.

Return to a useful view of the results with the collection context retained when possible. Use [feedback](../elements/feedback.md) near the affected content, and preserve or recover focus when an initiating action disappears. The application owns execution, persistence, retry semantics, and whether an operation is atomic or can partially succeed.
