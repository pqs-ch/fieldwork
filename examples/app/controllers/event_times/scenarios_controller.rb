module EventTimes
  class ScenariosController < ApplicationController
    def show
      @return_to = review_destination
    end
    def create
      return head :unprocessable_content unless params[:scenario] == 'failure'
      EventRecords.fail_next_recording(@key)
      redirect_to review_destination || event_times_scenarios_path, status: :see_other, notice: 'The next recording in this browser workspace will fail once. Its reviewed details remain available for retry.'
    end

    private

    def review_destination
      attempt = params[:attempt].to_s
      draft = @store[:drafts][attempt]
      if draft && draft[:review] && !draft[:recorded_id] && draft[:revision].to_s == params[:revision].to_s
        review_event_times_events_path(attempt: attempt, revision: draft[:revision])
      end
    end
  end
end
