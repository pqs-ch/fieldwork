module RecordActivities
  require 'thread'
  require 'securerandom'

  # Synthetic application data and workflow. None of these rules belongs to Fieldwork.
  module ServiceRequests
    STEPS = [
      {kind: 'assessment', title: 'Assess request', task: 'Assess the replacement', description: 'Record the findings and an estimated replacement cost.'},
      {kind: 'order', title: 'Record order', task: 'Order the replacement', description: 'Record the supplier, reference and expected delivery date.'},
      {kind: 'installation', title: 'Confirm installation', task: 'Install and test', description: 'Confirm the installation date and the working result.'}
    ].freeze
    STATES = {'assessment' => 'Needs assessment', 'order' => 'Ready to order', 'installation' => 'Awaiting installation', 'complete' => 'Completed'}.freeze
    RECORDED = {'assessment' => 'Assessment recorded', 'order' => 'Order recorded', 'installation' => 'Installation confirmed', 'note' => 'Progress note recorded'}.freeze
    LOCK = Mutex.new
    ATTEMPTS = {}
    RECORDS = [
      [2048, 'Reception display flickers', 'Reception', 'Maya Patel', 'Alex Morgan', 'The visitor display flickers after warming up. Reception is using a printed welcome sign while the display is out of service.', 'assessment'],
      [2051, 'Meeting room speaker has failed', 'Meeting room A', 'Taylor Reed', 'Sam Rivera', 'Remote participants cannot hear the room clearly. Replace the failed conference speaker.', 'order'],
      [2055, 'Warehouse label printer is unreliable', 'Warehouse', 'Jordan Lee', 'Jamie Chen', 'Labels are intermittently blank. A replacement printer is needed for dispatch.', 'installation'],
      [2062, 'Mailroom scanner jams on duplex jobs', 'Mailroom', 'Priya Nair', 'Alex Morgan', 'Duplex scans stop after the third page. Staff are scanning each side separately while the scanner is out of service.', 'complete']
    ].to_h do |id, title, location, reporter, owner, description, phase|
      opened = {id: "opened-#{id}", kind: 'opened', actor: reporter, title: 'Request opened', at: '2026-10-20T09:15:00Z', values: {'notes' => 'Reported the equipment fault.'}}
      record = {id: id, title: title, location: location, reporter: reporter, owner: owner, description: description, phase: phase, version: 1, events: [opened]}
      if phase != 'assessment'
        values = if phase == 'complete'
          {'notes' => "The feed rollers slip under duplex load. Cleaning and a replacement roller set did not resolve the fault.\n\nReplace the scanner with a model that supports the existing document-management connection. Retain the current network settings and test a full batch after installation.", 'estimate' => '480'}
        else
          {'notes' => 'Confirmed the hardware fault. Replacement is the most practical resolution.', 'estimate' => '650'}
        end
        record[:assessment] = values
        record[:events].unshift(id: "assessment-#{id}", kind: 'assessment', actor: owner, title: RECORDED['assessment'], at: '2026-10-20T11:00:00Z', values: values)
      end
      if %w[installation complete].include?(phase)
        values = if phase == 'complete'
          {'notes' => 'Ordered the compatible duplex scanner with network setup and removal of the failed unit.', 'supplier' => 'Northline Office', 'order_reference' => 'PO-1071', 'expected_on' => '2026-10-23'}
        else
          {'notes' => 'Replacement ordered for the dispatch team.', 'supplier' => 'Northline Office', 'order_reference' => 'PO-1082', 'expected_on' => (Date.current + 3).iso8601}
        end
        record[:order] = values
        record[:events].unshift(id: "order-#{id}", kind: 'order', actor: owner, title: RECORDED['order'], at: '2026-10-20T14:30:00Z', values: values)
      end
      if phase == 'complete'
        values = {'notes' => "Installed the replacement and reconnected it to the document-management service.\n\nA 40-page duplex batch completed without a feed error. Priya confirmed that the scanned files were readable and arrived in the correct mailroom folder.", 'installed_on' => '2026-10-23', 'tested' => '1'}
        record[:installation] = values
        record[:events].unshift(id: "installation-#{id}", kind: 'installation', actor: owner, title: RECORDED['installation'], at: '2026-10-23T10:45:00Z', values: values)
      end
      [id, record]
    end

    INITIAL_RECORDS = RECORDS.deep_dup.freeze

    def self.reset
      LOCK.synchronize do
        RECORDS.replace(INITIAL_RECORDS.deep_dup)
        ATTEMPTS.clear
      end
    end

    def self.all = LOCK.synchronize { RECORDS.values.deep_dup }
    def self.find(id) = LOCK.synchronize { RECORDS[id.to_i]&.deep_dup }
    def self.next_step(record) = STEPS.find { |step| step[:kind] == record[:phase] }
    def self.available?(record, kind) = kind == 'note' || next_step(record)&.fetch(:kind) == kind
    def self.title(kind) = kind == 'note' ? 'Record progress note' : STEPS.find { |step| step[:kind] == kind }&.fetch(:title)
    def self.outstanding(record)
      index = STEPS.index { |step| step[:kind] == record[:phase] }
      index ? STEPS.drop(index) : []
    end

    def self.issue(id, kind)
      LOCK.synchronize do
        record = RECORDS[id.to_i]
        return unless record && available?(record, kind)
        token = SecureRandom.uuid
        baseline = RecordActivity.new(kind: kind).values
        ATTEMPTS[token] = {record_id: record[:id], kind: kind, version: record[:version], baseline: baseline}
        {token: token, baseline: baseline.deep_dup}
      end
    end

    def self.baseline(token, id, kind)
      LOCK.synchronize do
        attempt = ATTEMPTS[token]
        attempt[:baseline].deep_dup if attempt && attempt[:record_id] == id.to_i && attempt[:kind] == kind
      end
    end

    def self.record(id, activity, token)
      LOCK.synchronize do
        record = RECORDS[id.to_i]
        attempt = ATTEMPTS[token]
        return :invalid_attempt unless attempt && attempt[:record_id] == id.to_i && attempt[:kind] == activity.kind
        return :already_recorded if attempt[:completed]
        return :conflict unless record && record[:version] == attempt[:version] && available?(record, activity.kind)
        values = activity.values
        event = {id: SecureRandom.hex(6), kind: activity.kind, title: RECORDED.fetch(activity.kind), actor: 'Alex Morgan', at: Time.now.utc.iso8601, values: values}
        record[:events].unshift(event)
        if activity.kind != 'note'
          record[activity.kind.to_sym] = values
          index = STEPS.index { |step| step[:kind] == activity.kind }
          record[:phase] = STEPS[index + 1]&.fetch(:kind) || 'complete'
        end
        record[:version] += 1
        attempt[:completed] = true
        :recorded
      end
    end
  end
end
