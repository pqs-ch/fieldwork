module MixedForms
  class ApplicationController < ::ApplicationController
    layout "mixed_forms/layouts/application"
    before_action { @review_example = ExampleCatalogue.find("mixed-forms") }
  end
end
