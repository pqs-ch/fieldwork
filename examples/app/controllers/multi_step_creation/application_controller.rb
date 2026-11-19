module MultiStepCreation
  class ApplicationController < ::ApplicationController
    layout "multi_step_creation/layouts/application"
    before_action { @review_example = ExampleCatalogue.find("multi-step-creation") }
    before_action :load_workspace

    private

    def load_workspace
      @key = session[:multi_step_creation_workspace] ||= SecureRandom.uuid
      @store = ReviewRequests.workspace(@key)
    end

    def fetch_draft
      @draft = ReviewRequests.workspace(@key)[:drafts][params[:id] || params[:draft_id]]
      unless @draft
        render 'multi_step_creation/drafts/expired', status: :gone
        return false
      end
      if @draft[:record_id]
        redirect_to multi_step_creation_request_path(@draft[:record_id]), status: :see_other, notice: 'This draft has already been created.'
        return false
      end
      true
    end

    def first_incomplete
      %w[details scope].find { |step| !@draft[:completed].include?(step) } || 'details'
    end

    def step_path(step, **options)
      step == 'details' ? details_multi_step_creation_draft_path(@draft[:id], **options) : scope_multi_step_creation_draft_path(@draft[:id], **options)
    end
    helper_method :step_path, :first_incomplete
  end
end
