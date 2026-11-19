module ApplicationLayout
  class ApplicationController < ::ApplicationController
    helper ApplicationLayout::ApplicationHelper
    layout "application_layout/layouts/application"
    before_action { @review_example = ExampleCatalogue.find("application-layout") }
    protect_from_forgery with: :exception
  end
end
