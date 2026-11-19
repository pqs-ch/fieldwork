module Operations
  class ProjectsController < ApplicationController
    helper_method :status_tone, :money, :query_url
    before_action :load_project, except: [:index, :new, :create]
    def index
      @all = OperationsData.all
      @owners = OperationsData::OWNERS
      @statuses = OperationsData::STATUSES
      @query = ProjectQuery.new(params, records: @all, today: OperationsData::REFERENCE_DATE)
      @name_condition, @name_text = @query.name_condition, @query.name_text
      @owner_values, @status_values, @sort = @query.owner_values, @query.status_values, @query.sort
      rows = @query.rows
      @count = rows.length
      @page = params[:page].to_i.clamp(1, [(@count / 6.0).ceil, 1].max)
      @rows = rows.slice((@page - 1) * 6, 6) || []
      render :index, status: :unprocessable_entity unless @query.valid?
    end
    def new
      @project = OperationProject.new(name: '', description: '', owner: OperationsData::OWNERS.first, status: 'Planned', due_on: '2026-11-20', budget: '0', version: 1)
      @baseline = @project.attributes.except('id', 'version')
      render :edit
    end
    def create
      @project = OperationProject.new(params.require(:operation_project).permit(:name, :description, :owner, :status, :due_on, :budget))
      @baseline = {name: '', description: '', owner: OperationsData::OWNERS.first, status: 'Planned', due_on: '2026-11-20', budget: '0'}
      if @project.valid?
        id = OperationsData.create(@project.attributes.symbolize_keys)
        redirect_to operations_project_path(id), status: :see_other, notice: 'Project created.'
      else
        render :edit, status: :unprocessable_entity
      end
    end
    def show
      @events = OperationsData.events(@project.id)
    end
    def edit; end
    def update
      @baseline = @project.attributes.except('id', 'version')
      attempted = params.require(:operation_project).permit(:name, :description, :owner, :status, :due_on, :budget)
      @project.assign_attributes(attempted)
      if !@project.valid?
        render :edit, status: :unprocessable_entity
      elsif OperationsData.save(@project.attributes.symbolize_keys, base: params[:base_version])
        redirect_to operations_project_path(@project.id), status: :see_other, notice: 'Project changes saved.'
      else
        @error = 'This project was saved in another window. Your edits are retained. Open the latest saved project separately before deciding what to keep.'
        render :edit, status: :conflict
      end
    end
    def status_tone(status)
      {'In progress' => 'neutral', 'Completed' => 'success', 'On hold' => 'warning', 'Planned' => 'neutral'}[status]
    end
    def money(value) = helpers.number_to_currency(value, unit: 'CHF ', precision: 0, delimiter: ',')
    def query_url(**changes) = operations_projects_path(request.query_parameters.merge(changes.transform_keys(&:to_s)).except('controller', 'action'))
    private
    def load_project
      values = OperationsData.find(params[:id])
      return head :not_found unless values
      @project = OperationProject.new(values)
      @baseline = @project.attributes.except('id', 'version')
    end
  end
end
