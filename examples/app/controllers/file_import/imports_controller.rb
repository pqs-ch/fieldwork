module FileImport
  class ImportsController < ApplicationController
    before_action :load_batch, only: [:mapping, :save_mapping, :review, :execute, :show, :retry_failed, :scenarios, :scenario]

    def index; end
    def new; end

    def sample
      send_data SupplierImports::SAMPLE, type: 'text/csv; charset=utf-8', disposition: 'attachment', filename: 'supplier-sample.csv'
    end

    def create
      id = SupplierImports.upload(@key, params[:source])
      respond_to do |format|
        format.json { render json: { location: mapping_file_import_import_path(id) }, status: :created }
        format.html { redirect_to mapping_file_import_import_path(id), status: :see_other }
      end
    rescue ArgumentError => error
      @error = error.message
      respond_to do |format|
        format.json { render json: { message: @error }, status: :unprocessable_entity }
        format.html { @reselect = true; render :new, status: :unprocessable_entity }
      end
    end

    def mapping
      return redirect_to file_import_import_path(@batch[:id]) if @batch[:operation]
      @mapping = @batch[:mapping]
    end

    def save_mapping
      @mapping = params.fetch(:columns, ActionController::Parameters.new).permit(*SupplierImports::FIELDS.keys).to_h
      result = SupplierImports.map(@key, @batch[:id], params[:revision], @mapping)
      refresh_batch
      case result
      when :finished then redirect_to file_import_import_path(@batch[:id]), status: :see_other
      when :mapped then redirect_to review_file_import_import_path(@batch[:id]), status: :see_other
      when :stale
        @error = 'The saved mapping changed in another tab. Your attempted mapping has not overwritten it. Open the saved mapping before continuing.'
        render :stale, status: :conflict
      else
        @errors = result
        render :mapping, status: :unprocessable_entity
      end
    end

    def review
      return redirect_to file_import_import_path(@batch[:id]) if @batch[:operation]
      return redirect_to mapping_file_import_import_path(@batch[:id]) unless @batch[:validation]
    end

    def execute
      result = SupplierImports.execute(@key, @batch[:id], params[:revision], params[:policy])
      refresh_batch
      case result
      when :finished then redirect_to file_import_import_path(@batch[:id]), status: :see_other
      when :stale, :changed
        @error = result == :changed ? 'The supplier register changed since validation. No rows were imported. Check the updated validation results before confirming.' : 'The mapping changed after this review was opened. No rows were imported. Check the current saved mapping and results.'
        render :stale, status: :conflict
      else
        @error = result == :policy ? 'Choose whether to require every row to be valid or import valid rows only.' : 'No rows were imported. Correct invalid rows or explicitly choose valid rows only. At least one ready row is required.'
        render :review, status: :unprocessable_entity
      end
    end

    def show
      return redirect_to review_file_import_import_path(@batch[:id]) unless @batch[:operation]
    end

    def retry_failed
      SupplierImports.retry_failed(@key, @batch[:id], params[:attempt])
      redirect_to file_import_import_path(@batch[:id]), status: :see_other
    end

    def scenario
      SupplierImports.fail_next(@key, @batch[:id])
      redirect_to review_file_import_import_path(@batch[:id]), status: :see_other, notice: 'The next import will fail once. All-or-nothing will roll back; valid-rows-only can keep other successes.'
    end

    def scenarios
      return redirect_to file_import_import_path(@batch[:id]) if @batch[:operation]
      redirect_to mapping_file_import_import_path(@batch[:id]) unless @batch[:validation]
    end
  end
end
