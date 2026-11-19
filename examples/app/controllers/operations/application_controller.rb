module Operations
  class ApplicationController < ::ApplicationController
    layout "operations/layouts/application"
    before_action { @review_example = ExampleCatalogue.find("operations") }
    protect_from_forgery with: :exception
  end
end
