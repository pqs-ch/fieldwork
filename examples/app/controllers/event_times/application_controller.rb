module EventTimes
  class ApplicationController < ::ApplicationController
    helper EventTimes::ApplicationHelper
    layout "event_times/layouts/application"
    before_action { @review_example = ExampleCatalogue.find("event-times") }
    protect_from_forgery with: :exception
    before_action :load_workspace

    private

    def load_workspace
      @key = session[:event_times_workspace] ||= SecureRandom.uuid
      @store = EventRecords.workspace(@key)
    end
  end
end
