module PurchaseRequest
  class SuppliersController < ApplicationController
    def index
      @region=params[:region]=='regional' ? 'regional' : 'all'
      @generation=session[:purchase_request_contacts_generation] || 0
    end
    def options
      sleep 0.4 if params[:q]=='Slow'
      values=PurchaseEntry::SUPPLIERS.select { |_,name| params[:q]=='Slow' || name.downcase.include?(params[:q].to_s.downcase) }
      render json: {items:values.map { |id,label| {value:id,label:label} },hasMore:false}
    end
    def refresh
      @generation=session[:purchase_request_contacts_generation]=(session[:purchase_request_contacts_generation] || 0)+1
      @region='all'
      respond_to do |format|
        format.turbo_stream do
          stream=params[:mode]=='update' ? turbo_stream.update('supplier-lookup',partial:'purchase_request/suppliers/lookup_contents',locals:{region:@region,generation:@generation}) : turbo_stream.replace('supplier-lookup',partial:'purchase_request/suppliers/lookup',locals:{region:@region,generation:@generation})
          render turbo_stream: stream
        end
        format.html { redirect_to purchase_request_suppliers_path,status: :see_other,notice:'Supplier reference refreshed.' }
      end
    end
  end
end
