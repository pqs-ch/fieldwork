module DraftProtection
  class ApplicationController < ::ApplicationController
    layout "draft_protection/layouts/application"
    before_action { @review_example = ExampleCatalogue.find("draft-protection") }
  end
end
