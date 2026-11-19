module MultiStepCreation
  class DraftsController < ApplicationController
    before_action :fetch_draft, except: :create

    def create
      id = ReviewRequests.start(@key)
      redirect_to details_multi_step_creation_draft_path(id), status: :see_other
    end

    def details
      show_step('details')
    end

    def scope
      unless @draft[:completed].include?('details')
        return redirect_to details_multi_step_creation_draft_path(@draft[:id]), notice: 'Complete the supplier details first.'
      end
      show_step('scope')
    end

    def save_details
      save_step('details')
    end

    def save_scope
      save_step('scope')
    end

    def review
      result = ReviewRequests.review(@key, @draft[:id])
      @draft = ReviewRequests.workspace(@key)[:drafts][@draft[:id]]
      if result == :incomplete
        return redirect_to step_path(first_incomplete), notice: 'Complete the remaining details before reviewing.'
      end
      return redirect_to multi_step_creation_request_path(@draft[:record_id]) if result == :created
      @step = 'review'
      @values = @draft[:review][:values]
    end

    def scenario
      ReviewRequests.fail_next(@key, @draft[:id])
      redirect_to review_multi_step_creation_draft_path(@draft[:id]), status: :see_other, notice: 'The next creation attempt will fail once. The draft will be retained.'
    end

    def scenarios
      unless @draft[:review] && @draft[:review][:revision] == @draft[:revision]
        redirect_to review_multi_step_creation_draft_path(@draft[:id])
      end
    end

    private

    def show_step(step)
      @step = step
      @entry = ReviewRequestEntry.new(@draft[:values])
      @return_to_review = params[:return_to] == 'review' && @draft[:completed].sort == %w[details scope]
      render :step
    end

    def save_step(step)
      @step = step
      @return_to_review = params[:return_to] == 'review'
      submitted = params.fetch(:entry, ActionController::Parameters.new).permit(*ReviewRequests::STEP_FIELDS.fetch(step)).to_h
      @entry = ReviewRequestEntry.new(@draft[:values].merge(submitted))
      valid = @entry.valid?(step.to_sym)
      result = ReviewRequests.save(@key, @draft[:id], step, params[:revision], @entry.values)
      @draft = ReviewRequests.workspace(@key)[:drafts][@draft[:id]]
      case result
      when :saved, :invalid
        if params[:intent] == 'leave'
          redirect_to multi_step_creation_requests_path, status: :see_other, notice: 'Draft saved.'
        elsif params[:intent] == 'back'
          redirect_to details_multi_step_creation_draft_path(@draft[:id]), status: :see_other
        elsif !valid
          render :step, status: :unprocessable_entity
        elsif @return_to_review || step == 'scope'
          redirect_to review_multi_step_creation_draft_path(@draft[:id]), status: :see_other
        else
          redirect_to scope_multi_step_creation_draft_path(@draft[:id]), status: :see_other
        end
      when :created
        redirect_to multi_step_creation_request_path(@draft[:record_id]), status: :see_other
      when :stale
        @error = 'This draft changed in another tab. Your attempted answers are shown below; they have not overwritten the saved draft.'
        render :stale_step, status: :conflict
      else
        render :expired, status: :gone
      end
    end
  end
end
