module Operations
  require 'bigdecimal'

  # This app owns query execution, calendar boundaries and validation.
  class ProjectQuery
    TEXT_OPTIONS = [['No filter', 'any'], ['Equals', 'equals'], ['Does not equal', 'not-equals'], ['Begins with', 'starts'], ['Ends with', 'ends'], ['Contains', 'contains'], ['Does not contain', 'not-contains'], ['Is blank', 'blank'], ['Is not blank', 'not-blank']].freeze
    NUMBER_OPTIONS = [['No filter', 'any'], ['Equals', 'equals'], ['Does not equal', 'not-equals'], ['Greater than', 'greater'], ['Greater than or equal to', 'greater-equal'], ['Less than', 'less'], ['Less than or equal to', 'less-equal'], ['Between', 'between']].freeze
    DATE_OPTIONS = [['No filter', 'any'], ['Equals', 'equals'], ['Before', 'before'], ['After', 'after'], ['Between', 'between'], ['Tomorrow', 'tomorrow'], ['Today', 'today'], ['Yesterday', 'yesterday']] + %w[week month quarter year].flat_map { |unit| [['Next', 'next'], ['This', 'this'], ['Last', 'last']].map { |label, value| ["#{label} #{unit}", "#{value}-#{unit}"] } } + [['Year to date', 'year-to-date'], ['All dates in the period', 'period']]
    PERIOD_OPTIONS = (1..4).map { |quarter| ["Quarter #{quarter}", "quarter:#{quarter}"] } + (1..12).map { |month| [Date::MONTHNAMES[month], format('month:%02d', month)] }
    SORT_OPTIONS = [['Default order', '']] + %w[name owner status].flat_map { |key| [["#{key.capitalize} A–Z", "#{key}:ascending"], ["#{key.capitalize} Z–A", "#{key}:descending"]] } + [['Due date oldest to newest', 'due_on:ascending'], ['Due date newest to oldest', 'due_on:descending'], ['Budget smallest to largest', 'budget:ascending'], ['Budget largest to smallest', 'budget:descending']]
    attr_reader :rows, :errors, :name_condition, :name_text, :owner_values, :status_values, :sort,
      :budget_condition, :budget_minimum, :budget_maximum, :due_condition, :due_date, :due_end, :due_period, :today

    def initialize(params, records: OperationsData.all, today: Date.current, owners: OperationsData::OWNERS, statuses: OperationsData::STATUSES)
      @errors = {}
      @owners, @statuses = owners, statuses
      @today = today
      @name_condition = condition(params[:name_condition], TEXT_OPTIONS, :name_condition)
      @name_text = params[:name_text].to_s
      @owner_values = params[:owner_values_present] ? Array(params[:owner_values]) & @owners : @owners
      @status_values = params[:status_values_present] ? Array(params[:status_values]) & @statuses : @statuses
      @sort = params[:sort].to_s
      @sort = '' unless SORT_OPTIONS.any? { |_, value| value == @sort }
      @budget_condition = condition(params[:budget_condition], NUMBER_OPTIONS, :budget_condition)
      @budget_minimum, @budget_maximum = params.values_at(:budget_minimum, :budget_maximum).map(&:to_s)
      @due_condition = condition(params[:due_condition], DATE_OPTIONS, :due_condition)
      @due_date, @due_end, @due_period = params.values_at(:due_date, :due_end, :due_period).map(&:to_s)
      validate
      @rows = valid? ? records.select { |row| matches?(row) } : []
      unless sort.empty?
        column, direction = sort.split(':')
        @rows.sort_by! { |row| [column == 'budget' ? BigDecimal(row[:budget]) : row[column.to_sym].downcase, row[:id]] }
        @rows.reverse! if direction == 'descending'
      end
    end

    def valid? = errors.empty?
    def filtered? = name_condition != 'any' || budget_condition != 'any' || due_condition != 'any' || owner_values != @owners || status_values != @statuses

    private

    def condition(value, options, field)
      value = value.presence || 'any'
      errors[field] = 'Choose a supported condition.' unless options.any? { |_, key| key == value }
      value
    end

    def amount(value, field)
      number = BigDecimal(value, exception: false)
      errors[field] = 'Enter a finite amount.' unless number&.finite?
      number
    end

    def date(value, field)
      raise Date::Error unless value.match?(/\A\d{4}-\d{2}-\d{2}\z/)
      result = Date.iso8601(value)
      raise Date::Error unless result.year.positive?
      result
    rescue Date::Error
      errors[field] = 'Enter a valid date.'
      nil
    end

    def validate
      if !%w[any blank not-blank].include?(name_condition) && name_text.blank?
        errors[:name_text] = 'Enter text to match.'
      end
      if budget_condition != 'any'
        @minimum = amount(budget_minimum, :budget_minimum)
        if budget_condition == 'between'
          @maximum = amount(budget_maximum, :budget_maximum)
          errors[:budget_maximum] = 'Maximum must be at least the minimum.' if @minimum&.finite? && @maximum&.finite? && @maximum < @minimum
        end
      end
      if %w[equals before after between].include?(due_condition)
        @date = date(due_date, :due_date)
        if due_condition == 'between'
          @end = date(due_end, :due_end)
          errors[:due_end] = 'End date must be on or after the start date.' if @date && @end && @end < @date
        end
      elsif due_condition == 'period' && !PERIOD_OPTIONS.any? { |_, value| value == due_period }
        errors[:due_period] = 'Choose a month or quarter.'
      end
    end

    def matches?(row)
      name_matches?(row[:name]) && owner_values.include?(row[:owner]) && status_values.include?(row[:status]) &&
        budget_matches?(BigDecimal(row[:budget])) && due_matches?(Date.iso8601(row[:due_on]))
    end

    def name_matches?(value)
      name, text = value.downcase, name_text.downcase
      case name_condition
      when 'equals' then name == text
      when 'not-equals' then name.present? && name != text
      when 'starts' then name.start_with?(text)
      when 'ends' then name.end_with?(text)
      when 'contains' then name.include?(text)
      when 'not-contains' then name.present? && !name.include?(text)
      when 'blank' then name.blank?
      when 'not-blank' then name.present?
      else true
      end
    end

    def budget_matches?(value)
      case budget_condition
      when 'equals' then value == @minimum
      when 'not-equals' then value != @minimum
      when 'greater' then value > @minimum
      when 'greater-equal' then value >= @minimum
      when 'less' then value < @minimum
      when 'less-equal' then value <= @minimum
      when 'between' then value.between?(@minimum, @maximum)
      else true
      end
    end

    def due_matches?(value)
      case due_condition
      when 'any' then true
      when 'equals' then value == @date
      when 'before' then value < @date
      when 'after' then value > @date
      when 'between' then value.between?(@date, @end)
      when 'period'
        unit, number = due_period.split(':')
        unit == 'month' ? value.month == number.to_i : ((value.month - 1) / 3 + 1) == number.to_i
      else relative_range.cover?(value)
      end
    end

    def relative_range
      case due_condition
      when 'today' then today..today
      when 'tomorrow' then (today + 1)..(today + 1)
      when 'yesterday' then (today - 1)..(today - 1)
      when 'year-to-date' then today.beginning_of_year..today
      else
        direction, unit = due_condition.split('-')
        offset = {'last' => -1, 'this' => 0, 'next' => 1}.fetch(direction)
        if unit == 'week'
          start = today.beginning_of_week(:monday) + offset * 7
          start..(start + 6)
        else
          months = {'month' => 1, 'quarter' => 3, 'year' => 12}.fetch(unit)
          start = today.public_send("beginning_of_#{unit}") >> (offset * months)
          start..((start >> months) - 1)
        end
      end
    end
  end
end
