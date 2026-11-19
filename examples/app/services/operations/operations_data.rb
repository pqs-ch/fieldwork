module Operations
  require 'thread'
  module OperationsData
    REFERENCE_DATE = Date.new(2026, 11, 12)
    MUTEX = Mutex.new
    OWNERS = ['Alex Morgan', 'Sam Rivera', 'Jamie Chen'].freeze
    STATUSES = ['Planned', 'In progress', 'On hold', 'Completed'].freeze
    PROJECTS = [
      ['Website refresh', 'Alex Morgan', 'In progress', '2026-11-20', '48000', 'Make our services easier to find and use. Refresh the public website, simplify navigation and improve the enquiry journey.'],
      ['Customer onboarding', 'Sam Rivera', 'In progress', '2026-11-06', '24000', 'Give new customers a clear path from account creation to their first useful outcome.'],
      ['Quarterly access review', 'Jamie Chen', 'Planned', '2026-12-04', '8500', 'Review access to shared applications and document follow-up work.'],
      ['Service catalogue', 'Alex Morgan', 'On hold', '2026-12-11', '16000', 'Create one place to find internal services and their owners.'],
      ['Reporting foundations', 'Sam Rivera', 'In progress', '2026-11-27', '32000', 'Align the definitions and source data behind operational reporting.'],
      ['Supplier renewal', 'Jamie Chen', 'Completed', '2026-10-16', '12000', 'Confirm service coverage and complete the annual supplier review.'],
      ['Knowledge base', 'Alex Morgan', 'Planned', '2026-12-18', '18000', 'Make working guidance searchable, current and easy to maintain.'],
      ['Workspace consolidation', 'Sam Rivera', 'In progress', '2026-11-13', '27000', 'Bring project records together without losing ownership or history.'],
      ['Incident response guide', 'Jamie Chen', 'Completed', '2026-10-09', '6500', 'Clarify responsibilities and escalation paths during incidents.']
    ].each_with_index.map { |(name, owner, status, due_on, budget, description), i| {id: i + 1, name: name, owner: owner, status: status, due_on: due_on, budget: budget, description: description, version: 1} }
    EVENTS = [{actor: 'Alex Morgan', message: 'moved the project to In progress.', at: '2026-10-20T14:30:00Z'}, {actor: 'Sam Rivera', message: 'added the discovery milestone.', at: '2026-10-19T09:15:00Z'}, {actor: 'Jamie Chen', message: 'created the project.', at: '2026-10-16T11:00:00Z'}]
    INITIAL_PROJECTS = PROJECTS.deep_dup.freeze
    INITIAL_EVENTS = EVENTS.deep_dup.freeze

    def self.reset
      MUTEX.synchronize do
        PROJECTS.replace(INITIAL_PROJECTS.deep_dup)
        EVENTS.replace(INITIAL_EVENTS.deep_dup)
      end
    end

    def self.all = MUTEX.synchronize { PROJECTS.map(&:dup) }
    def self.find(id) = all.find { |project| project[:id] == id.to_i }
    def self.events(id) = MUTEX.synchronize { id.to_i == 1 ? EVENTS.map(&:dup) : [] }
    def self.create(values)
      MUTEX.synchronize do
        id = PROJECTS.map { |p| p[:id] }.max + 1
        PROJECTS << values.merge(id: id, version: 1)
        id
      end
    end
    def self.save(values, base:)
      MUTEX.synchronize do
        record = PROJECTS.find { |item| item[:id] == values[:id] }
        return false unless record && record[:version] == base.to_i
        record.merge!(values.except(:version)).merge!(version: record[:version] + 1)
        EVENTS.unshift(actor: 'You', message: 'updated the project details.', at: Time.now.utc.iso8601) if record[:id] == 1
        true
      end
    end
  end
end
