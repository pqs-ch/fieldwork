module PurchaseRequest
  class PurchasesController < ApplicationController
    helper_method :amount

    def index; end

    def new
      @attempt = params[:attempt].presence || PurchaseRequests.start(@key)
      return unless draft
      @entry = PurchaseEntry.new(@draft[:values])
    end

    def preview
      @attempt = params[:attempt]
      return unless draft
      @entry = PurchaseEntry.new(params.require(:entry).permit(*PurchaseEntry::FIELDS))
      result = PurchaseRequests.preview(@key, @attempt, params[:revision], @entry)
      @draft = PurchaseRequests.workspace(@key)[:drafts][@attempt]
      case result
      when :ready then redirect_to review_purchase_request_purchases_path(attempt: @attempt, revision: @draft[:revision]), status: :see_other
      when :invalid then render :new, status: :unprocessable_entity
      when :created then redirect_to purchase_request_purchase_path(@draft[:record_id]), status: :see_other
      else render :stale_edit, status: :conflict
      end
    end

    def review
      @attempt = params[:attempt]
      return unless draft
      unless @draft[:review] && @draft[:revision].to_s == params[:revision].to_s
        return render :stale, status: :conflict
      end
      @record = @draft[:review]
    end

    def create
      @attempt = params[:attempt]
      return unless draft
      result = PurchaseRequests.create(@key, @attempt, params[:revision])
      @draft = PurchaseRequests.workspace(@key)[:drafts][@attempt]
      case result
      when :created then redirect_to purchase_request_purchase_path(@draft[:record_id]), status: :see_other
      when :failure
        @record = @draft[:review]
        @error = 'The request could not be saved. Nothing was created; your reviewed values are retained. Try again.'
        render :review, status: :service_unavailable
      else render :stale, status: :conflict
      end
    end

    def show
      @record = @store[:records][params[:id].to_i]
      head :not_found unless @record
    end

    def scenario
      PurchaseRequests.fail_next(@key)
      redirect_to review_purchase_request_purchases_path(attempt: params[:attempt], revision: params[:revision]),
        status: :see_other, notice: 'The next confirmation will fail once.'
    end

    def scenarios
      @attempt = params[:attempt]
      return unless draft
      unless @draft[:review] && @draft[:revision].to_s == params[:revision].to_s
        render :stale, status: :conflict
      end
    end

    def amount(minor, currency)
      scale = PurchaseEntry::CURRENCIES.fetch(currency)
      helpers.number_to_currency(BigDecimal(minor.to_s) / (10**scale),
        unit: "#{currency} ", precision: scale, delimiter: ',')
    end

    private

    def draft
      @draft = PurchaseRequests.workspace(@key)[:drafts][@attempt]
      unless @draft
        render :expired, status: :gone
        return false
      end
      if @draft[:record_id]
        redirect_to purchase_request_purchase_path(@draft[:record_id]), status: :see_other
        return false
      end
      true
    end
  end
end
