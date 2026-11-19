module EventTimes
  require 'securerandom'
  require 'thread'

  # Isolated synthetic workspaces; no database or real operational records.
  module EventRecords
    LOCK = Mutex.new
    WORKSPACES = {}

    def self.reset(key) = LOCK.synchronize { WORKSPACES.delete(key) }

    def self.workspace(key)
      LOCK.synchronize { (WORKSPACES[key] ||= {drafts: {}, records: {}, fail_next: false}).deep_dup }
    end

    def self.begin_draft(key)
      LOCK.synchronize do
        token = SecureRandom.uuid
        WORKSPACES.fetch(key)[:drafts][token] = {values: EventEntry.new.values, revision: 0, review: nil, recorded_id: nil}
        token
      end
    end

    def self.preview(key, token, entry, valid)
      LOCK.synchronize do
        draft = WORKSPACES.fetch(key)[:drafts][token]
        return :expired unless draft
        return :recorded if draft[:recorded_id]
        draft[:values] = entry.values.deep_dup
        draft[:revision] += 1
        draft[:review] = valid ? entry.values.symbolize_keys.merge(entry.resolved).deep_dup : nil
        valid ? :reviewed : :invalid
      end
    end

    def self.record(key, token, revision)
      LOCK.synchronize do
        store = WORKSPACES.fetch(key)
        draft = store[:drafts][token]
        return :expired unless draft
        return :duplicate if draft[:recorded_id]
        return :stale unless draft[:review] && draft[:revision].to_s == revision.to_s
        if store[:fail_next]
          store[:fail_next] = false
          return :failure
        end
        id = store[:records].size + 1
        store[:records][id] = draft[:review].merge(id: id, recorded_at: Time.now.utc.iso8601, actor: 'Alex Morgan').deep_dup
        draft[:recorded_id] = id
        :recorded
      end
    end

    def self.fail_next_recording(key)
      LOCK.synchronize do
        WORKSPACES.fetch(key)[:fail_next] = true
      end
    end
  end
end
