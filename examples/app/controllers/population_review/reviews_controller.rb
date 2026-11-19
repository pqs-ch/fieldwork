module PopulationReview
  class ReviewsController < ApplicationController
    before_action :load_review, except: :index
    before_action :load_input, only: [:assessment, :record_assessment, :finding, :record_finding, :details, :comparison]

    def index; end
    def show; end

    def start
      PopulationReviews.start(@key, @review[:id])
      redirect_to population_review_review_path(@review[:id]), status: :see_other, notice: 'Review started. Save assessments individually and return when you need to.'
    end

    def assessment
      prepare('assessment')
    end

    def finding
      if !PopulationReviews.finding_needed?(@input) || PopulationReviews.changed?(@store, @review, @input)
        return redirect_to population_review_review_path(@review[:id], view: @view), notice: 'Review the current assessment before recording a finding.'
      end
      prepare('finding')
    end

    def completion
      prepare('completion')
    end

    def details; end

    def comparison
      @assessment = @input[:assessments].find { |item| item[:number].to_s == params[:assessment].to_s }
      return head :not_found unless @assessment
      @observed_at = Time.now.utc.iso8601
      @comparison = AssessmentComparison.new(store: @store, input: @input, assessment: @assessment) unless @store[:comparison_unavailable]
    end

    def record_assessment = save_entry('assessment')
    def record_finding = save_entry('finding')
    def complete = save_entry('completion')

    private

    def load_review
      @review = @store[:reviews][params[:id].to_i] || @store[:reviews][params[:review_id].to_i]
      head :not_found unless @review
    end

    def load_input
      @input = @review[:inputs]&.find { |input| input[:id] == params[:input_id].to_i }
      head :not_found unless @input
    end

    def prepare(kind)
      if @review[:completed_at] || !@review[:inputs]
        return redirect_to population_review_review_path(@review[:id]), notice: 'Review the current review state before continuing.'
      end
      @kind = kind
      issued = PopulationReviews.issue(@key, @review[:id], @input&.fetch(:id), kind)
      @attempt, @baseline = issued.values_at(:token, :baseline)
      @entry = ReviewEntry.new(@baseline.merge(kind: kind))
      render :entry
    end

    def save_entry(kind)
      @kind = kind
      @attempt = params[:attempt].to_s
      attempt = @store[:attempts][@attempt]
      @baseline = attempt && attempt.values_at(:review, :input, :kind) == [@review[:id], @input&.fetch(:id), kind] ? attempt[:baseline] : ReviewEntry.new(kind: kind).values
      @entry = ReviewEntry.new(params.require(:review_entry).permit(:choice, :notes, :owner).merge(kind: kind))
      return render :entry, status: :unprocessable_entity unless @entry.valid?
      result = PopulationReviews.record(@key, @review[:id], @input&.fetch(:id), @entry, @attempt)
      if [:recorded, :duplicate].include?(result)
        message = result == :duplicate ? 'This submission was already recorded.' : {
          'assessment' => 'Assessment saved.',
          'finding' => 'Finding recorded. Treatment remains open.',
          'completion' => 'Review completed. Open findings retain their own follow-up.'
        }.fetch(kind)
        flash[:saved_input] = @input[:id] if @input
        redirect_to population_review_review_path(@review[:id], view: @view, anchor: 'review-result'), status: :see_other, notice: message
      else
        @needs_fresh_form = ![:unavailable, :blocked].include?(result)
        @error = case result
        when :unavailable then 'The save service is temporarily unavailable. Nothing was recorded. Your entered values are retained; try again.'
        when :blocked then 'This review has outstanding work. Your conclusion is retained. Resolve the blockers shown below before completing.'
        else 'The review or supporting facts changed, or this form expired. Nothing was recorded. Your entered values are retained. Review the latest state in a new tab, then open a fresh form.'
        end
        render :entry, status: result == :unavailable ? :service_unavailable : :conflict
      end
    end
  end
end
