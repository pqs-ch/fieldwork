module PopulationReview
  class ReviewEvidenceController < ApplicationController
    before_action :load_context

    def new
      return redirect_to evidence_return, notice: 'Completed reviews are read-only.' if @review[:completed_at]
      @mode = params[:mode] == 'upload' ? 'upload' : 'link'
      @entry = EvidenceEntry.new(kind: @mode)
      @baseline = @entry.values
      @attempt = ReviewEvidence.issue(@key, @mode, review_id: @review[:id], input_id: @input[:id])
    end

    def create
      @mode = params[:mode] == 'upload' ? 'upload' : 'link'
      @entry = EvidenceEntry.new(params.require(:evidence_entry).permit(:artifact_id, :source, :evidence_date, :purpose).merge(kind: @mode))
      @entry.files = Array(params[:files]).reject(&:blank?)
      @baseline = EvidenceEntry.new(kind: @mode).values
      @attempt = params[:attempt].to_s
      return failed(@entry.errors.full_messages.join('. '), :unprocessable_entity) unless @entry.valid?
      finish(ReviewEvidence.record(@key, @entry, @attempt, review_id: @review[:id], input_id: @input[:id]))
    end

    def removal
      @use = ReviewEvidence.active(@input).find { |use| use[:id] == params[:use_id] }
      return head :not_found unless @use
      return redirect_to evidence_return, notice: 'Completed reviews are read-only.' if @review[:completed_at]
      @artifact = @store[:evidence].fetch(@use[:artifact_id])
      @attempt = ReviewEvidence.issue(@key, 'remove', review_id: @review[:id], input_id: @input[:id], item_id: @use[:id])
    end

    def remove
      @use = ReviewEvidence.active(@input).find { |use| use[:id] == params[:use_id] }
      @artifact = @use && @store[:evidence].fetch(@use[:artifact_id])
      @attempt = params[:attempt].to_s
      finish(ReviewEvidence.record(@key, EvidenceEntry.new(kind: 'remove'), @attempt,
        review_id: @review[:id], input_id: @input[:id], item_id: params[:use_id]))
    end

    private

    def load_context
      @review = @store[:reviews][params[:review_id].to_i]
      @input = @review && @review[:inputs]&.find { |input| input[:id] == params[:input_id].to_i }
      head :not_found unless @input
    end

    def evidence_return = population_review_review_input_path(@review[:id], @input[:id], view: @view, anchor: 'evidence-heading')

    def finish(result)
      if [:recorded, :duplicate].include?(result)
        message = result == :duplicate ? 'This submission was already recorded.' : action_name == 'remove' ? 'Evidence link removed. The original file is unchanged.' : 'Evidence saved. Check the material and record a fresh assessment when needed.'
        respond_to do |format|
          format.html { redirect_to evidence_return, status: :see_other, notice: message }
          format.json do
            flash[:notice] = message
            render json: {location: evidence_return}
          end
        end
      else
        message = case result
        when :failure then 'The save service is temporarily unavailable. Nothing was recorded. Your entered values are retained; try again.'
        when :unavailable then 'This evidence is no longer available. Choose another file or inspect its source.'
        when :linked then 'This file is already linked to the account. Inspect the existing link before choosing other evidence.'
        else 'The review, evidence or form changed. Nothing was recorded. Your entered values are retained; inspect the current account in a new tab, then open a fresh form.'
        end
        failed(message, result == :failure ? :service_unavailable : :conflict)
      end
    end

    def failed(message, status)
      @error = message
      respond_to do |format|
        format.json { render json: {message: message}, status: status }
        format.html { render action_name == 'remove' ? :removal : :new, status: status }
      end
    end
  end
end
