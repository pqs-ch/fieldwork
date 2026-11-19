module Operations
  class WorkQueueQuery < ProjectQuery
    SORT_OPTIONS = ProjectQuery::SORT_OPTIONS.reject { |_,key| key.start_with?('budget:') } + [['Type A–Z','kind:ascending'],['Type Z–A','kind:descending']]
    KEYS = %w[name_condition name_text owner_values_present owner_values status_values_present status_values due_condition due_date due_end due_period kind_values_present kind_values sort].freeze
    attr_reader :kind_values
    def initialize(params,records:[])
      input=params.to_h.stringify_keys.slice(*KEYS).with_indifferent_access
      requested_sort=input[:sort].to_s
      requested_sort='' unless SORT_OPTIONS.any? { |_,key| key==requested_sort }
      kind_sort=requested_sort.start_with?('kind:')
      input[:sort]=kind_sort ? '' : requested_sort
      unless input[:status_values_present]
        input[:status_values_present]='1'; input[:status_values]=WorkQueue::STATUSES-['Done']
      end
      super(input,records:records,today:OperationsData::REFERENCE_DATE,owners:WorkQueue::OWNERS,statuses:WorkQueue::STATUSES)
      @kind_values=input[:kind_values_present] ? WorkQueue::KINDS & Array(input[:kind_values]) : WorkQueue::KINDS
      @rows.select! { |row| @kind_values.include?(row[:kind]) }
      if kind_sort && SORT_OPTIONS.any? { |_,key| key==requested_sort }
        @sort=requested_sort
        @rows.sort_by! { |row| [row[:kind],row[:id]] }; @rows.reverse! if @sort.end_with?('descending')
      end
    end
    def filtered? = super || kind_values!=WorkQueue::KINDS
    def canonical
      {'name_condition'=>name_condition,'name_text'=>%w[any blank not-blank].include?(name_condition) ? '' : name_text,
       'owner_values_present'=>'1','owner_values'=>WorkQueue::OWNERS & owner_values,
       'status_values_present'=>'1','status_values'=>WorkQueue::STATUSES & status_values,
       'kind_values_present'=>'1','kind_values'=>WorkQueue::KINDS & kind_values,
       'due_condition'=>due_condition,'due_date'=>%w[equals before after between].include?(due_condition) ? due_date : '',
       'due_end'=>due_condition=='between' ? due_end : '', 'due_period'=>due_condition=='period' ? due_period : '', 'sort'=>sort}
    end
  end
end
