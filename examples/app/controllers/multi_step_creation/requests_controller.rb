module MultiStepCreation
  class RequestsController < ApplicationController
    def index; end

    def create
      return unless fetch_draft
      result = ReviewRequests.create(@key, @draft[:id], params[:revision])
      @draft = ReviewRequests.workspace(@key)[:drafts][@draft[:id]]
      case result
      when :created, :duplicate
        redirect_to multi_step_creation_request_path(@draft[:record_id]), status: :see_other
      when :failure
        @step = 'review'
        @values = @draft[:review][:values]
        @error = 'The service is unavailable. No request was created. Your reviewed answers are retained; try again.'
        render 'multi_step_creation/drafts/review', status: :service_unavailable
      when :stale, :incomplete
        render 'multi_step_creation/drafts/stale_review', status: :conflict
      else
        render 'multi_step_creation/drafts/expired', status: :gone
      end
    end

    def show
      @record = @store[:records][params[:id].to_i]
      head :not_found unless @record
    end
  end
end
