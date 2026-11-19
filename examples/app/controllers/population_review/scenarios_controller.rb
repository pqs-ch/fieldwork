module PopulationReview
  class ScenariosController < ApplicationController
    def show
      @key = session[:population_review_workspace] ||= SecureRandom.uuid
      @store = PopulationReviews.snapshot(@key)
    end

    def create
      key = session[:population_review_workspace] ||= SecureRandom.uuid
      PopulationReviews.snapshot(key)
      PopulationReviews.simulate(key, params[:scenario])
      redirect_to population_review_scenarios_path, status: :see_other, notice: 'Synthetic scenario applied.'
    end
  end
end
