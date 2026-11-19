module Operations
  require 'uri'

  class WorkController < ApplicationController
    before_action :workspace
    helper_method :work_url_for, :task_action, :return_path, :task_tone

    def index
      prepare
    end

    def new_view
      prepare
    end

    def settings
      prepare
    end

    def deletion
      prepare
      head :not_found unless performed? || @personal
    end

    def scenarios
      prepare
    end

    def save_view
      @state = WorkViewState.parse(params[:state])
      @view_name = params[:name].to_s
      result, value = WorkQueue.save_view(@key,
        id: params[:saved_id].presence, revision: params[:view_revision], name: @view_name, state: @state)
      if result == :saved
        return redirect_to operations_work_index_path(view: value, page: params[:page]),
          status: :see_other, notice: 'Personal view saved.'
      end

      @conflict = result == :stale
      @view_error = case result
      when :failure then 'The view could not be saved. Your current query and columns are retained; try again.'
      when :stale then stale_view_message
      when :missing then 'This personal view is unavailable. Save your working settings as a new view.'
      else value
      end
      prepare(state: @state, view: result == :missing ? 'shared' : params[:view], revision: params[:view_revision])
      render(params[:saved_id].present? ? :index : :new_view,
        status: @conflict ? :conflict : :unprocessable_entity) unless performed?
    rescue ArgumentError => error
      @view_error = error.message
      prepare(view: params[:view])
      render(params[:saved_id].present? ? :index : :new_view, status: :unprocessable_entity) unless performed?
    end

    def rename_view
      manage_view(:rename)
    end

    def delete_view
      manage_view(:delete)
    end

    def make_default
      @state = WorkViewState.parse(params[:state])
      prepare(state: @state, view: params[:view], revision: params[:view_revision])
      return if performed?

      if !@modified && !@conflict && WorkQueue.make_default(@key, params[:view], @base_revision)
        redirect_to work_url_for(page: @page), status: :see_other, notice: 'Default work view updated.'
      else
        @view_error ||= 'Save or reset your working settings before making this view the default.'
        render :settings, status: @conflict ? :conflict : :unprocessable_entity
      end
    rescue ArgumentError => error
      @view_error = error.message
      prepare(view: params[:view])
      render :settings, status: :unprocessable_entity unless performed?
    end

    def scenario
      WorkQueue.fail_next(@key)
      @state = WorkViewState.parse(params[:state])
      prepare(state: @state, view: params[:view], revision: params[:view_revision])
      return if performed?

      redirect_to work_url_for(page: @page), status: :see_other,
        notice: 'The next view save will fail once. Your working settings are unchanged.'
    end

    def show
      return unless task
      @back = safe_return(params[:back])
      @notes = @item[:notes]
    end

    def complete
      return unless task
      @back = safe_return(params[:back])
      @notes = params[:notes].to_s
      result = WorkQueue.complete(@key, @item[:id], params[:task_version], @notes)
      if result == :done
        redirect_to @back, status: :see_other, notice: 'Task completed. The queue now reflects its current state.'
      else
        @task_error = result == :stale ?
          'This task changed in another tab. Your notes are retained. Open the latest task before completing it.' :
          'Enter outcome notes of 1–600 characters.'
        render :show, status: result == :stale ? :conflict : :unprocessable_entity
      end
    end

    def work_url_for(query: @query.canonical, columns: @columns, view: @selected[:id], page: nil, share: false, destination: :index)
      values = query.merge('view' => share ? 'shared' : view, 'explicit' => '1')
      values['columns'] = columns.to_json unless share
      values['basis'] = @base_revision unless share
      values['page'] = page if page && !share
      case share ? :index : destination
      when :new_view then operations_new_work_view_path(values)
      when :settings then operations_work_settings_path(values)
      when :deletion then operations_work_view_deletion_path(values)
      when :scenarios then operations_work_scenarios_path(values)
      else operations_work_index_path(values)
      end
    end

    def return_path = @back

    def task_action(item)
      { 'Review' => 'Record review', 'Delivery' => 'Complete delivery', 'Follow-up' => 'Resolve follow-up' }.fetch(item[:kind])
    end

    def task_tone(state)
      return 'success' if state == 'Done'
      state == 'Blocked' ? 'warning' : 'neutral'
    end

    private

    def manage_view(action)
      @state = WorkViewState.parse(params[:state])
      @rename_name = params[:name].to_s if action == :rename
      arguments = { id: params[:view], revision: params[:view_revision] }
      result, value = if action == :rename
        WorkQueue.rename_view(@key, **arguments, name: @rename_name)
      else
        WorkQueue.delete_view(@key, **arguments, replace_default: params[:replace_default])
      end

      if result == :deleted
        # Preserve working settings after removing their named baseline.
        prepare(state: @state, view: 'shared', revision: 0)
        return redirect_to work_url_for(page: @page), status: :see_other,
          notice: 'Personal view deleted. Your working settings remain as an unsaved query.'
      end
      if result == :saved
        prepare(state: @state, view: params[:view], revision: value)
        return redirect_to work_url_for(page: @page), status: :see_other, notice: 'Personal view renamed.'
      end

      if result == :missing
        prepare(state: @state, view: 'shared', revision: 0)
        @view_error = 'This personal view was deleted or is unavailable. Your working settings remain; save them as a new view.'
      else
        @conflict = result == :stale
        @view_error = @conflict ? stale_view_message : value
        prepare(state: @state, view: params[:view], revision: params[:view_revision])
      end
      render(result == :missing ? :index : action == :rename ? :settings : :deletion,
        status: @conflict ? :conflict : :unprocessable_entity) unless performed?
    rescue ArgumentError => error
      @view_error = error.message
      prepare(view: params[:view])
      render(action == :rename ? :settings : :deletion, status: :unprocessable_entity) unless performed?
    end

    def stale_view_message
      'This saved view changed in another tab. Your working query and columns are retained. Reset to the saved version or save as a new view.'
    end

    def workspace
      @key = session[:operations_work_workspace] ||= SecureRandom.uuid
      @workspace = WorkQueue.workspace(@key)
    end

    def prepare(state: nil, view: nil, revision: nil)
      @workspace = WorkQueue.workspace(@key)
      @builtins = WorkQueue.builtins
      id = view.presence || params[:view].presence || @workspace[:default]
      @selected = if id == 'shared'
        { id: 'shared', name: 'Shared query', revision: 0,
          state: { 'query' => WorkQueueQuery.new({}).canonical, 'columns' => WorkQueue.columns } }
      else
        @builtins[id] || @workspace[:views][id]
      end
      return render(:unavailable, status: :not_found) unless @selected

      query_values = if state
        state['query']
      elsif params[:explicit] == '1'
        params.to_unsafe_h
      else
        @selected[:state]['query']
      end
      @query = WorkQueueQuery.new(query_values, records: @workspace[:items])
      @columns = if state
        state['columns']
      elsif params[:columns].present?
        WorkViewState.columns(params[:columns])
      else
        @selected[:state]['columns']
      end
      @state = { 'query' => @query.canonical, 'columns' => @columns }
      @base_revision = revision.presence || params[:basis].presence || @selected[:revision]
      @personal = @workspace[:views].key?(@selected[:id])
      if @personal && @base_revision.to_s != @selected[:revision].to_s
        @conflict = true
        @view_error ||= stale_view_message
      end
      @modified = @state != @selected[:state]
      @page = params[:page].to_i.clamp(1, [@query.rows.length.fdiv(WorkQueue::PAGE_SIZE).ceil, 1].max)
      @rows = @query.rows.slice((@page - 1) * WorkQueue::PAGE_SIZE, WorkQueue::PAGE_SIZE) || []
    rescue ArgumentError => error
      @view_error = error.message
      @layout_invalid = true
      @columns = @selected[:state]['columns']
      @state = { 'query' => @query.canonical, 'columns' => @columns }
      @rows = []
      @page = 1
      @modified = true
    end

    def task
      @item = @workspace[:items].find { |row| row[:id] == params[:id].to_i }
      head :not_found unless @item
      @item
    end

    def safe_return(value)
      return operations_work_index_path if value.to_s.length > 8000
      uri = URI.parse(value.to_s)
      uri.scheme.nil? && uri.host.nil? && uri.path == operations_work_index_path && uri.fragment.nil? ? uri.to_s : operations_work_index_path
    rescue URI::InvalidURIError
      operations_work_index_path
    end
  end
end
