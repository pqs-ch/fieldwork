module EventTimes
  class EventsController < ApplicationController
    def index; end

    def new
      @attempt = params[:attempt].to_s
      if @attempt.empty?
        @attempt = EventRecords.begin_draft(@key)
        @draft = EventRecords.workspace(@key)[:drafts].fetch(@attempt)
      else
        @draft = @store[:drafts][@attempt]
        return render :stale, status: :conflict unless @draft
        return redirect_to event_times_event_path(@draft[:recorded_id]) if @draft[:recorded_id]
      end
      @entry = EventEntry.new(@draft[:values])
      @entry.valid? if @draft[:revision].positive?
      @baseline = @draft[:values]
    end

    def preview
      @attempt = params[:attempt].to_s
      @entry = EventEntry.new(params.require(:event_entry).permit(:subject, :local_time, :timezone, :review_on, :occurrence, :occurrence_basis))
      @baseline = @store[:drafts].dig(@attempt, :values) || EventEntry.new.values
      result = EventRecords.preview(@key, @attempt, @entry, @entry.valid?)
      @draft = EventRecords.workspace(@key)[:drafts][@attempt]
      case result
      when :reviewed
        redirect_to review_event_times_events_path(attempt: @attempt, revision: @draft[:revision]), status: :see_other
      when :invalid
        render :new, status: :unprocessable_entity
      when :recorded
        redirect_to event_times_event_path(@draft[:recorded_id]), status: :see_other, notice: 'This event was already recorded.'
      else
        @expired = true
        @error = 'This form expired. Your entered values are retained here. Start a fresh event form in a new tab to review them again.'
        render :new, status: :conflict
      end
    end

    def review
      @attempt = params[:attempt].to_s
      @draft = @store[:drafts][@attempt]
      return render :stale, status: :conflict unless @draft
      return redirect_to event_times_event_path(@draft[:recorded_id]) if @draft[:recorded_id]
      return render :stale, status: :conflict unless @draft[:review] && @draft[:revision].to_s == params[:revision].to_s
      @record = @draft[:review]
    end

    def create
      @attempt = params[:attempt].to_s
      result = EventRecords.record(@key, @attempt, params[:revision])
      @draft = EventRecords.workspace(@key)[:drafts][@attempt]
      case result
      when :recorded, :duplicate
        redirect_to event_times_event_path(@draft[:recorded_id]), status: :see_other, notice: result == :duplicate ? 'This event was already recorded.' : 'Event recorded. Follow-up remains a separate task.'
      when :failure
        @record = @draft[:review]
        @error = 'Recording is temporarily unavailable. Nothing was recorded. The reviewed details are retained; try again.'
        render :review, status: :service_unavailable
      else
        render :stale, status: :conflict
      end
    end

    def show
      @record = @store[:records][params[:id].to_i]
      head :not_found unless @record
    end
  end
end
