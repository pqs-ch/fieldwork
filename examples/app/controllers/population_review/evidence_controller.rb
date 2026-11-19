module PopulationReview
  class EvidenceController < ApplicationController
    before_action :load_artifact, except: :index

    def index; end
    def show; end

    def download
      return head :gone unless ReviewEvidence.available?(@artifact)
      send_data @artifact[:content], filename: @artifact[:name], type: 'application/octet-stream', disposition: 'attachment'
    end

    def withdrawal
      return redirect_to population_review_evidence_path(@artifact[:id]), notice: 'This original is already withdrawn.' if @artifact[:withdrawn_at]
      @entry = EvidenceEntry.new(kind: 'withdraw')
      @baseline = @entry.values
      @attempt = ReviewEvidence.issue(@key, 'withdraw', item_id: @artifact[:id])
    end

    def withdraw
      @entry = EvidenceEntry.new(params.require(:evidence_entry).permit(:reason).merge(kind: 'withdraw'))
      @baseline = EvidenceEntry.new(kind: 'withdraw').values
      @attempt = params[:attempt].to_s
      return render :withdrawal, status: :unprocessable_entity unless @entry.valid?
      result = ReviewEvidence.record(@key, @entry, @attempt, item_id: @artifact[:id])
      if [:recorded, :duplicate].include?(result)
        redirect_to population_review_evidence_path(@artifact[:id]), status: :see_other, notice: 'Original withdrawn. Its metadata and recorded assessment references are retained.'
      else
        @error = result == :failure ? 'The save service is temporarily unavailable. The original has not been withdrawn. Try again.' : 'This evidence or form changed. Inspect the current original and open a fresh withdrawal form.'
        render :withdrawal, status: result == :failure ? :service_unavailable : :conflict
      end
    end

    private

    def load_artifact
      @artifact = @store[:evidence][params[:id].to_i]
      head :not_found unless @artifact
    end
  end
end
