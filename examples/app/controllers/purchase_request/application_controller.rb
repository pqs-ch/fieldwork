module PurchaseRequest
  class ApplicationController < ::ApplicationController
    layout "purchase_request/layouts/application"
    before_action { @review_example = ExampleCatalogue.find("purchase-request") }
    before_action :workspace
    private
    def workspace
      @key=session[:purchase_request_workspace] ||= SecureRandom.uuid
      @store=PurchaseRequests.workspace(@key)
    end
  end
end
