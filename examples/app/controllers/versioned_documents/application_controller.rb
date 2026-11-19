module VersionedDocuments
  class ApplicationController < ::ApplicationController
    layout "versioned_documents/layouts/document_examples"
    before_action { @review_example = ExampleCatalogue.find("versioned-documents") }
    protect_from_forgery with: :exception
  end
end
