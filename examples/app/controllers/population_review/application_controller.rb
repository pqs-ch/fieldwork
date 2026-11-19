module PopulationReview
  class ApplicationController < ::ApplicationController
    helper PopulationReview::ApplicationHelper
    layout "population_review/layouts/application"
    before_action { @review_example = ExampleCatalogue.find("population-review") }
    protect_from_forgery with: :exception
    before_action :load_workspace

    private

    def load_workspace
      @key = session[:population_review_workspace] ||= SecureRandom.uuid
      @store = PopulationReviews.snapshot(@key)
      @view = PopulationReviews::VIEWS.key?(params[:view]) ? params[:view] : 'all'
    end
  end
end
