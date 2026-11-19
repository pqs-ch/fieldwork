module FileImport
  class ApplicationController < ::ApplicationController
    layout "file_import/layouts/application"
    before_action { @review_example = ExampleCatalogue.find("file-import") }
    before_action :load_workspace

    private

    def load_workspace
      @key = session[:file_import_workspace] ||= SecureRandom.uuid
      @store = SupplierImports.workspace(@key)
    end

    def load_batch
      @batch = @store[:batches][params[:id]]
      render 'file_import/imports/unavailable', status: :gone unless @batch
    end

    def refresh_batch
      @batch = SupplierImports.workspace(@key)[:batches].fetch(@batch[:id])
    end

    def counts(rows)
      rows.group_by { |row| row[:state] }.transform_values(&:length)
    end
    helper_method :counts
  end
end
