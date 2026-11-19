class ReviewController < ApplicationController
  layout 'review'
  before_action :load_example, except: :index

  def index
    @examples = ExampleCatalogue::EXAMPLES
  end

  def show; end
  def reset; end

  def restart
    ExampleReset.call(@example, session)
    flash[:clear_reminder] = true if @example.slug == 'draft-protection'
    redirect_to review_example_path(@example.slug), status: :see_other,
      notice: "#{@example.title} reset to its starting data."
  end

  private

  def load_example
    @example = ExampleCatalogue.find(params[:slug])
    head :not_found unless @example
  end
end
