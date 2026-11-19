module MultiStepCreation
  require 'securerandom'
  require 'thread'

  # Synthetic, session-isolated process memory. Drafts expire when Rails restarts.
  module ReviewRequests
    LOCK = Mutex.new
    WORKSPACES = {}
    STEP_FIELDS = { 'details' => %w[supplier owner], 'scope' => %w[purpose due_on approach assessor] }.freeze

    def self.reset(key) = LOCK.synchronize { WORKSPACES.delete(key) }

    def self.workspace(key)
      LOCK.synchronize { (WORKSPACES[key] ||= { drafts: {}, records: {} }).deep_dup }
    end

    def self.start(key)
      LOCK.synchronize do
        id = SecureRandom.uuid
        WORKSPACES.fetch(key)[:drafts][id] = { id: id, values: ReviewRequestEntry.new.values, revision: 0,
          completed: [], review: nil, record_id: nil, fail_next: false }
        id
      end
    end

    def self.save(key, id, step, revision, values)
      LOCK.synchronize do
        draft = WORKSPACES.fetch(key)[:drafts][id]
        return :expired unless draft
        return :created if draft[:record_id]
        return :stale unless draft[:revision].to_s == revision.to_s
        draft[:values].merge!(values.slice(*STEP_FIELDS.fetch(step)))
        draft[:revision] += 1
        draft[:review] = nil
        if ReviewRequestEntry.new(draft[:values]).valid?(step.to_sym)
          draft[:completed] |= [step]
          :saved
        else
          draft[:completed].delete(step)
          :invalid
        end
      end
    end

    def self.review(key, id)
      LOCK.synchronize do
        draft = WORKSPACES.fetch(key)[:drafts][id]
        return :expired unless draft
        return :created if draft[:record_id]
        return :incomplete unless STEP_FIELDS.keys.all? { |step| draft[:completed].include?(step) } && ReviewRequestEntry.complete?(draft[:values])
        draft[:review] = { revision: draft[:revision], values: draft[:values].deep_dup }
        :ready
      end
    end

    def self.create(key, id, revision)
      LOCK.synchronize do
        workspace = WORKSPACES.fetch(key)
        draft = workspace[:drafts][id]
        return :expired unless draft
        return :duplicate if draft[:record_id]
        return :stale unless draft[:review] && draft[:review][:revision].to_s == revision.to_s && draft[:revision].to_s == revision.to_s
        return :incomplete unless ReviewRequestEntry.complete?(draft[:values])
        if draft[:fail_next]
          draft[:fail_next] = false
          return :failure
        end
        record_id = workspace[:records].length + 1
        values = draft[:review][:values].deep_dup
        values.delete('assessor') unless values['approach'] == 'independent'
        workspace[:records][record_id] = { id: record_id, values: values, created_at: Time.now.utc.iso8601 }
        draft[:record_id] = record_id
        :created
      end
    end

    def self.fail_next(key, id)
      LOCK.synchronize do
        draft = WORKSPACES.fetch(key)[:drafts][id]
        draft[:fail_next] = true if draft && !draft[:record_id]
      end
    end
  end
end
