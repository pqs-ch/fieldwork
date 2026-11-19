module Operations
  require 'securerandom'
  require 'thread'

  # Synthetic personal workspaces; records and preferences expire on restart/reload.
  module WorkQueue
    LOCK = Mutex.new
    WORKSPACES = {}
    OWNERS = OperationsData::OWNERS
    STATUSES = ['Open', 'Planned', 'In progress', 'Awaiting review', 'Blocked', 'Done'].freeze
    KINDS = ['Review', 'Delivery', 'Follow-up'].freeze
    PAGE_SIZE = 10
    COLUMNS = {
      'name' => ['Task', 452], 'owner' => ['Owner', 184], 'status' => ['State', 176],
      'due_on' => ['Due date', 168], 'kind' => ['Type', 144]
    }.freeze

    def self.reset(key) = LOCK.synchronize { WORKSPACES.delete(key) }

    def self.columns
      COLUMNS.map { |key, (_, width)| { 'key' => key, 'visible' => true, 'width' => width } }
    end

    def self.seed
      [
        ['Review customer onboarding','Sam Rivera','Awaiting review','2026-11-06','Review',2],
        ['Continue website refresh','Alex Morgan','In progress','2026-11-20','Delivery',1],
        ['Resolve catalogue ownership','Alex Morgan','Blocked','2026-11-10','Follow-up',4],
        ['Review workspace migration','Sam Rivera','Awaiting review','2026-11-13','Review',8],
        ['Complete reporting definitions','Sam Rivera','In progress','2026-11-27','Delivery',5],
        ['Prepare knowledge-base launch','Alex Morgan','Planned','2026-12-18','Delivery',7],
        ['Review application access','Jamie Chen','Awaiting review','2026-12-04','Review',3],
        ['Resolve incident-guide feedback','Jamie Chen','Open','2026-11-04','Follow-up',9],
        ['Complete supplier handover','Jamie Chen','In progress','2026-11-09','Delivery',6],
        ['Review supplier renewal','Jamie Chen','Done','2026-10-16','Review',6],
        ['Check onboarding support ownership','Sam Rivera','Open','2026-11-17','Follow-up',2],
        ['Complete access review evidence pack','Jamie Chen','In progress','2026-11-19','Delivery',3],
        ['Review reporting sign-off','Alex Morgan','Awaiting review','2026-11-18','Review',5],
        ['Confirm migration handover','Sam Rivera','Planned','2026-11-23','Follow-up',8],
        ['Prepare supplier renewal decision','Jamie Chen','Open','2026-11-26','Follow-up',6]
      ].each_with_index.map { |(name,owner,status,due_on,kind,project), i| {id:i+1,name:name,owner:owner,status:status,due_on:due_on,kind:kind,project_id:project,budget:'0',version:1,notes:''} }
    end
    def self.workspace(key)
      LOCK.synchronize do
        (WORKSPACES[key] ||= { items: seed, views: {}, default: 'open', fail_next: false }).deep_dup
      end
    end

    def self.builtins
      base = WorkQueueQuery.new({}).canonical
      {
        'open' => { id: 'open', name: 'All open work', revision: 0,
          state: { 'query' => base, 'columns' => columns } },
        'overdue' => { id: 'overdue', name: 'Overdue', revision: 0,
          state: { 'query' => base.merge('due_condition' => 'before',
            'due_date' => OperationsData::REFERENCE_DATE.iso8601, 'sort' => 'due_on:ascending'), 'columns' => columns } },
        'review' => { id: 'review', name: 'Awaiting review', revision: 0,
          state: { 'query' => base.merge('status_values' => ['Awaiting review'], 'sort' => 'due_on:ascending'), 'columns' => columns } }
      }
    end

    def self.save_view(key, id:, revision:, name:, state:)
      LOCK.synchronize do
        workspace = WORKSPACES.fetch(key)
        view = id.present? ? workspace[:views][id] : nil
        return [:missing, nil] if id.present? && !view
        return [:stale, id] if view && view[:revision].to_s != revision.to_s

        name = view[:name] if view
        error = name_error(workspace, id, name.to_s.strip)
        return [:invalid, error] if error
        if workspace[:fail_next]
          workspace[:fail_next] = false
          return [:failure, nil]
        end
        return [:saved, id] if view && view[:state] == state

        id ||= SecureRandom.uuid
        workspace[:views][id] = {
          id: id, name: name.strip, revision: (view&.dig(:revision) || 0) + 1, state: state.deep_dup
        }
        [:saved, id]
      end
    end

    def self.rename_view(key, id:, revision:, name:)
      LOCK.synchronize do
        workspace = WORKSPACES.fetch(key)
        view = workspace[:views][id]
        return [:missing, nil] unless view
        return [:stale, nil] unless view[:revision].to_s == revision.to_s

        name = name.to_s.strip
        error = name_error(workspace, id, name)
        return [:invalid, error] if error

        view[:revision] += 1 unless view[:name] == name
        view[:name] = name
        [:saved, view[:revision]]
      end
    end

    def self.delete_view(key, id:, revision:, replace_default:)
      LOCK.synchronize do
        workspace = WORKSPACES.fetch(key)
        view = workspace[:views][id]
        return [:missing, nil] unless view
        return [:stale, nil] unless view[:revision].to_s == revision.to_s
        if workspace[:default] == id
          return [:invalid, 'Confirm that All open work will become your default.'] unless replace_default == 'open'
          workspace[:default] = 'open'
        end
        workspace[:views].delete(id)
        [:deleted, nil]
      end
    end

    def self.name_error(workspace, id, name)
      return 'Enter a view name of 1–50 characters.' if name.empty? || name.length > 50
      if workspace[:views].any? { |other_id, other| other_id != id && other[:name].casecmp?(name) }
        'Choose a different name; this personal view already exists.'
      end
    end

    def self.make_default(key, id, revision)
      LOCK.synchronize do
        workspace = WORKSPACES.fetch(key)
        view = builtins[id] || workspace[:views][id]
        return false unless view && view[:revision].to_s == revision.to_s
        workspace[:default] = id
        true
      end
    end

    def self.fail_next(key)
      LOCK.synchronize { WORKSPACES.fetch(key)[:fail_next] = true }
    end

    def self.complete(key, id, version, notes)
      LOCK.synchronize do
        item = WORKSPACES.fetch(key)[:items].find { |row| row[:id] == id.to_i }
        return :missing unless item
        return :done if item[:status] == 'Done'
        return :stale unless item[:version].to_s == version.to_s
        return :invalid if notes.to_s.strip.empty? || notes.length > 600

        item.merge!(status: 'Done', notes: notes.strip, version: item[:version] + 1)
        :done
      end
    end
  end
end
