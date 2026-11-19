module RecordActivities
  class ActivitiesController < ApplicationController
    before_action :load_context

    def new
      unless ServiceRequests.available?(@record, @kind)
        return redirect_to record_activities_request_path(@record[:id]), notice: 'That activity is no longer available. Review the current request.'
      end
      issued = ServiceRequests.issue(@record[:id], @kind)
      return redirect_to record_activities_request_path(@record[:id]) unless issued
      @attempt, @baseline = issued.values_at(:token, :baseline)
      @activity = RecordActivity.new(@baseline.merge('kind' => @kind))
    end

    def create
      @attempt = params[:attempt].to_s
      @baseline = ServiceRequests.baseline(@attempt, @record[:id], @kind) || RecordActivity.new(kind: @kind).values
      @activity = RecordActivity.new(params.require(:record_activity).permit(:notes, :estimate, :supplier, :order_reference, :expected_on, :installed_on, :tested).merge(kind: @kind))
      return render :new, status: :unprocessable_entity unless @activity.valid?
      result = ServiceRequests.record(@record[:id], @activity, @attempt)
      if [:recorded, :already_recorded].include?(result)
        message = result == :already_recorded ? 'This activity was already recorded. The current request is shown below.' : "#{ServiceRequests::RECORDED.fetch(@kind)}."
        redirect_to record_activities_request_path(@record[:id]), status: :see_other, notice: message
      else
        @error = result == :conflict ?
          'This request changed after you opened the form. Nothing was recorded; your entries are retained. Review the latest request and choose an available activity.' :
          'This activity form has expired. Nothing was recorded; your entries are retained. Review the current request and open a fresh activity form.'
        render :new, status: :conflict
      end
    end

    private

    def load_context
      @record = ServiceRequests.find(params[:request_id])
      @kind = params[:kind].to_s
      head :not_found unless @record && ServiceRequests.title(@kind)
    end
  end
end
