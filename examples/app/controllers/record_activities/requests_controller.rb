module RecordActivities
  class RequestsController < ApplicationController
    def index
      @records = ServiceRequests.all
    end

    def show
      @record = ServiceRequests.find(params[:id])
      head :not_found unless @record
    end
  end
end
