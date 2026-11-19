module Operations
  require 'json'

  # Validate every persisted/shared state at the app boundary, not in Fieldwork.
  module WorkViewState
    def self.columns(value)
      value=JSON.parse(value) if value.is_a?(String)
      keys=WorkQueue::COLUMNS.keys
      unless value.is_a?(Array) && value.size==keys.size && value.all? { |c| c.is_a?(Hash) && c['key'].is_a?(String) } && value.map { |c| c['key'] }.sort==keys.sort &&
          value.all? { |c| [true,false].include?(c['visible']) && c['width'].is_a?(Integer) && c['width'].between?(112,960) } &&
          value.find { |c| c['key']=='name' }['visible']
        raise ArgumentError,'The column layout is invalid. Keep Task visible and provide each supported column once.'
      end
      value.map { |c| c.slice('key','visible','width') }
    rescue JSON::ParserError
      raise ArgumentError,'The column layout could not be read.'
    end
    def self.parse(value)
      value=JSON.parse(value) if value.is_a?(String)
      raise ArgumentError,'The view state could not be read.' unless value.is_a?(Hash) && value['query'].is_a?(Hash)
      query=WorkQueueQuery.new(value['query'])
      raise ArgumentError,'Correct the query before saving this view.' unless query.valid?
      {'query'=>query.canonical,'columns'=>columns(value['columns'])}
    rescue JSON::ParserError
      raise ArgumentError,'The view state could not be read.'
    end
  end
end
