module RecordActivities
  class ApplicationController < ::ApplicationController
    helper RecordActivities::ApplicationHelper
    layout "record_activities/layouts/application"
    before_action { @review_example = ExampleCatalogue.find("record-activities") }
    protect_from_forgery with: :exception
  end
end
