module FileImport
  require 'csv'
  require 'securerandom'
  require 'thread'
  require 'uri'

  # Bounded, synthetic session-isolated storage. Nothing survives a server restart.
  module SupplierImports
    LOCK = Mutex.new
    WORKSPACES = {}
    FIELDS = { 'reference' => 'Supplier reference', 'name' => 'Supplier name', 'email' => 'Owner email' }.freeze
    SAMPLE = "Vendor ID,Company,Email,Region\nSUP-101,Northstar Hosting,alex@example.test,CH\nSUP-102,,sam@example.test,DE\nSUP-001,Evergreen Services,ops@example.test,CH\nSUP-101,Duplicate Northstar,alex@example.test,GB\nSUP-103,Harbor Analytics,bad-email,NL\nSUP-104,Alpine Logistics,sam@example.test,AT\n".freeze

    def self.reset(key) = LOCK.synchronize { WORKSPACES.delete(key) }

    def self.workspace(key)
      LOCK.synchronize do
        (WORKSPACES[key] ||= { batches: {}, suppliers: { 'SUP-001' => { 'reference' => 'SUP-001', 'name' => 'Evergreen Services', 'email' => 'ops@example.test' } } }).deep_dup
      end
    end

    def self.upload(key, file)
      raise ArgumentError, 'Choose a CSV file.' unless file.respond_to?(:read)
      raise ArgumentError, 'Choose a .csv file.' unless File.extname(file.original_filename).downcase == '.csv'
      source = file.read(100_001)
      raise ArgumentError, 'The file exceeds 100 KB. Choose a smaller CSV file.' if source.bytesize > 100_000
      source.force_encoding(Encoding::UTF_8)
      raise ArgumentError, 'Use UTF-8 text without binary content.' unless source.valid_encoding? && !source.include?("\0")
      source = source.delete_prefix("\uFEFF")
      rows = CSV.parse(source)
      headers = rows.shift
      raise ArgumentError, 'Include a header row and at least one data row.' unless headers&.any? && rows.any?
      raise ArgumentError, 'Use at most 12 columns with nonempty, unique headers.' if headers.size > 12 || headers.any?(&:blank?) || headers.map { |h| h.strip.downcase }.uniq.size != headers.size
      raise ArgumentError, 'Use at most 100 data rows.' if rows.size > 100
      raise ArgumentError, 'Every row must have the same number of cells as the header. Check delimiters and quoting.' unless rows.all? { |row| row.size == headers.size }
      LOCK.synchronize do
        id = SecureRandom.uuid
        aliases = { 'reference' => ['reference', 'vendor id', 'supplier reference'], 'name' => ['name', 'company', 'supplier name'], 'email' => ['email', 'owner email'] }
        mapping = aliases.to_h { |field, names| [field, headers.index { |h| names.include?(h.strip.downcase) }&.to_s || ''] }
        WORKSPACES.fetch(key)[:batches][id] = { id: id, filename: File.basename(file.original_filename), source: source,
          headers: headers, rows: rows, mapping: mapping, revision: 0, validation: nil, operation: nil, fail_next: false }
        id
      end
    rescue CSV::MalformedCSVError
      raise ArgumentError, 'The CSV could not be read. Check separators, closing quotes and line endings, then try again.'
    end

    def self.map(key, id, revision, mapping)
      LOCK.synchronize do
        store = WORKSPACES.fetch(key)
        batch = store[:batches].fetch(id)
        return :finished if batch[:operation]
        return :stale unless revision.to_s == batch[:revision].to_s
        errors = {}
        FIELDS.each do |field, label|
          unless mapping[field].to_s.match?(/\A\d+\z/) && mapping[field].to_i < batch[:headers].size
            errors[field] = "Choose a source column for #{label.downcase}."
          end
        end
        available = mapping.reject { |field, _| errors.key?(field) }
        available.group_by { |_, column| column.to_i }.each_value do |assignments|
          next if assignments.size == 1
          assignments.each { |field, _| errors[field] = 'Map each source column only once.' }
        end
        return errors unless errors.empty?
        batch[:mapping] = mapping
        batch[:revision] += 1
        batch[:validation] = validate(batch, store[:suppliers])
        :mapped
      end
    end

    def self.validate(batch, suppliers)
      seen = []
      batch[:rows].each_with_index.map do |cells, index|
        values = FIELDS.to_h { |field, _| [field, cells[batch[:mapping].fetch(field).to_i].to_s.strip] }
        ref = values['reference']
        errors = []
        errors << 'Supplier reference must use SUP- followed by three digits.' unless ref.match?(/\ASUP-\d{3}\z/)
        errors << 'Supplier name is required (maximum 80 characters).' if values['name'].blank? || values['name'].length > 80
        errors << 'Enter a valid owner email address (maximum 120 characters).' unless values['email'].length <= 120 && values['email'].match?(URI::MailTo::EMAIL_REGEXP)
        duplicate = suppliers.key?(ref) ? 'Reference already exists; the existing supplier will not be changed.' : seen.include?(ref) ? 'Repeated reference in this file; only its first occurrence is considered.' : nil
        seen << ref
        { row: index + 2, values: values, state: duplicate ? 'skipped' : errors.any? ? 'invalid' : 'ready',
          message: duplicate || errors.join(' ') }
      end
    end

    def self.execute(key, id, revision, policy)
      LOCK.synchronize do
        store = WORKSPACES.fetch(key)
        batch = store[:batches].fetch(id)
        return :finished if batch[:operation] # One operation per uploaded source.
        return :stale unless batch[:validation] && batch[:revision].to_s == revision.to_s
        fresh = validate(batch, store[:suppliers])
        if fresh != batch[:validation]
          batch[:validation] = fresh
          batch[:revision] += 1
          return :changed
        end
        return :policy unless %w[all valid].include?(policy)
        return :blocked if fresh.none? { |row| row[:state] == 'ready' } || (policy == 'all' && fresh.any? { |row| row[:state] == 'invalid' })
        batch[:operation] = { policy: policy, revision: batch[:revision], attempt: 1,
          results: fresh.deep_dup.map { |row| row[:state] == 'invalid' ? row.merge(state: 'excluded') : row } }
        perform(batch, store[:suppliers])
        :finished
      end
    end

    def self.perform(batch, suppliers)
      eligible = batch[:operation][:results].select { |row| %w[ready failed].include?(row[:state]) }
      if batch[:operation][:policy] == 'all' && batch[:fail_next] && eligible.any?
        batch[:fail_next] = false
        eligible.each { |row| row.merge!(state: 'failed', message: 'The operation was rolled back after a temporary failure. No suppliers were added; retry this batch.') }
        return
      end
      batch[:operation][:results].each do |row|
        next unless %w[ready failed].include?(row[:state])
        ref = row[:values]['reference']
        if suppliers.key?(ref)
          row.merge!(state: 'skipped', message: 'Reference now exists; no existing supplier was changed.')
        elsif batch[:fail_next]
          batch[:fail_next] = false
          row.merge!(state: 'failed', message: 'Temporarily unavailable. This row was not imported; retry it here.')
        else
          suppliers[ref] = row[:values].deep_dup
          row.merge!(state: 'imported', message: 'Supplier added.')
        end
      end
    end

    def self.retry_failed(key, id, attempt)
      LOCK.synchronize do
        store = WORKSPACES.fetch(key)
        batch = store[:batches].fetch(id)
        operation = batch[:operation]
        return unless operation && operation[:attempt].to_s == attempt.to_s && operation[:results].any? { |row| row[:state] == 'failed' }
        operation[:attempt] += 1
        perform(batch, store[:suppliers])
      end
    end

    def self.fail_next(key, id)
      LOCK.synchronize do
        batch = WORKSPACES.fetch(key)[:batches].fetch(id)
        batch[:fail_next] = true unless batch[:operation]
      end
    end
  end
end
