class ExampleReset
  def self.call(example, session)
    case example.slug
    when 'operations'
      Operations::OperationsData.reset
      Operations::WorkQueue.reset(session[:operations_work_workspace])
    when 'record-activities' then RecordActivities::ServiceRequests.reset
    when 'versioned-documents' then VersionedDocuments::DocumentExamples.reset
    when 'population-review' then PopulationReview::PopulationReviews.reset(session[:population_review_workspace])
    when 'purchase-request' then PurchaseRequest::PurchaseRequests.reset(session[:purchase_request_workspace])
    when 'event-times' then EventTimes::EventRecords.reset(session[:event_times_workspace])
    when 'file-import' then FileImport::SupplierImports.reset(session[:file_import_workspace])
    when 'multi-step-creation' then MultiStepCreation::ReviewRequests.reset(session[:multi_step_creation_workspace])
    when 'mixed-forms' then MixedForms::MixedFormsController::STORE.delete(session[:mixed_forms_mixed_project_key])
    end
    session.keys.grep(/^#{example.namespace}_/).each { |key| session.delete(key) }
  end
end
