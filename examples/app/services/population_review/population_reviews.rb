module PopulationReview
  require 'securerandom'
  require 'digest'
  require 'thread'

  # Synthetic storage and review policy belong to this example, not Fieldwork.
  # One process; workspaces survive navigation and tabs sharing the browser cookie.
  module PopulationReviews
    LOCK = Mutex.new
    WORKSPACES = {}
    CHOICES = {'satisfactory' => 'Satisfactory', 'discrepancy' => 'Discrepancy found', 'excluded' => 'Outside scope'}.freeze
    VIEWS = {'all' => 'All accounts', 'outstanding' => 'Outstanding', 'changed' => 'Changed facts', 'completed' => 'Finished'}.freeze

    def self.reset(key) = LOCK.synchronize { WORKSPACES.delete(key) }

    def self.seed
      sources = [
        ['Backup automation', 'Jamie Chen', 'Backup vault · daily recovery copies'],
        ['Deployment robot', 'Sam Rivera', 'Production release service'],
        ['Retired reporting integration', 'Not assigned', 'Legacy reporting · confirm whether this still operates'],
        ['Provider export — regional compliance reporting and reconciliation', 'Maya Patel', 'Reporting workspace · read-only exports']
      ].each_with_index.to_h do |(name, owner, scope), index|
        [index + 1, {id: index + 1, name: name, owner: owner, scope: scope, version: 1}]
      end
      sources[1].merge!(legacy_reference: 'BACKUP-LEGACY-04', interactive_sign_in: false, active_sessions: 0)
      {sources: sources, evidence: ReviewEvidence.seed, evidence_attempts: {}, attempts: {}, fail_next: false, reviews: {
        1 => {id: 1, title: 'Service-account assurance review', scope: 'Service and automation accounts recorded in the main workspace', inputs: nil, events: []},
        2 => {id: 2, title: 'Satellite-office account review', scope: 'Service and automation accounts for the satellite office', inputs: nil, events: []}
      }}
    end

    def self.snapshot(key)
      LOCK.synchronize { (WORKSPACES[key] ||= seed).deep_dup }
    end

    def self.latest(input) = input[:assessments].last
    def self.changed?(store, review, input)
      !review[:completed_at] && latest(input) && (latest(input)[:source_version] != store[:sources].fetch(input[:id])[:version] || latest(input)[:evidence_basis] != ReviewEvidence.basis(store, input))
    end
    def self.finding_needed?(input)
      latest(input)&.fetch(:choice) == 'discrepancy' && input[:findings].none? { |finding| finding[:assessment] == input[:assessments].size }
    end
    def self.state(store, review, input)
      return 'Changed facts' if changed?(store, review, input)
      return 'Not assessed' unless latest(input)
      return 'Finding required' if finding_needed?(input)
      latest(input)[:choice] == 'excluded' ? 'Excluded' : 'Reviewed'
    end
    def self.ready?(store, review, input) = %w[Reviewed Excluded].include?(state(store, review, input))
    def self.visible?(store, review, input, view)
      case view
      when 'outstanding' then !ready?(store, review, input)
      when 'changed' then !!changed?(store, review, input)
      when 'completed' then ready?(store, review, input)
      else true
      end
    end
    def self.basis(store, review)
      Digest::SHA256.hexdigest([review[:captured_at], review[:inputs]&.map { |input| [input[:id], store[:sources].fetch(input[:id])[:version], input[:assessments].size, input[:findings].size, ReviewEvidence.basis(store, input)] }].to_json)
    end
    def self.event(review, title, notes = '')
      review[:events].unshift(title: title, notes: notes, actor: 'Alex Morgan', at: Time.now.utc.iso8601)
    end

    def self.start(key, id)
      LOCK.synchronize do
        store = WORKSPACES.fetch(key); review = store[:reviews].fetch(id)
        return if review[:inputs]
        review[:captured_at] = Time.now.utc.iso8601
        review[:inputs] = (id == 1 ? store[:sources].values : []).map do |source|
          {id: source[:id], captured: source.deep_dup, assessments: [], findings: [], evidence_uses: []}
        end
        event(review, 'Review started', "Captured #{review[:inputs].size} accounts. Later additions are outside this review.")
      end
    end

    def self.issue(key, id, input_id, kind)
      LOCK.synchronize do
        store = WORKSPACES.fetch(key); review = store[:reviews].fetch(id)
        input = review[:inputs]&.find { |item| item[:id] == input_id }
        baseline = if kind == 'assessment' && input && latest(input)
          latest(input).slice(:choice, :notes).transform_keys(&:to_s)
        else
          ReviewEntry.new(kind: kind).values
        end
        token = SecureRandom.uuid
        store[:attempts][token] = {review: id, input: input_id, kind: kind, baseline: baseline, basis: basis(store, review),
          evidence_basis: input && ReviewEvidence.basis(store, input), version: input && store[:sources].fetch(input_id)[:version], assessment: input && input[:assessments].size}
        {token: token, baseline: baseline.deep_dup}
      end
    end

    def self.record(key, id, input_id, entry, token)
      LOCK.synchronize do
        store = WORKSPACES.fetch(key); review = store[:reviews].fetch(id)
        attempt = store[:attempts][token]
        return :expired unless attempt && attempt.values_at(:review, :input, :kind) == [id, input_id, entry.kind]
        return :duplicate if attempt[:done]
        return :conflict if review[:completed_at] || !review[:inputs]
        input = review[:inputs].find { |item| item[:id] == input_id }
        if entry.kind == 'completion'
          return :conflict unless attempt[:basis] == basis(store, review)
          return :blocked unless review[:inputs].all? { |item| ready?(store, review, item) }
        else
          return :conflict unless input && attempt[:version] == store[:sources].fetch(input_id)[:version] && attempt[:assessment] == input[:assessments].size && attempt[:evidence_basis] == ReviewEvidence.basis(store, input)
          return :conflict if entry.kind == 'finding' && (!finding_needed?(input) || changed?(store, review, input))
        end
        if store[:fail_next]
          store[:fail_next] = false
          return :unavailable
        end
        values = entry.values.symbolize_keys.merge(actor: 'Alex Morgan', at: Time.now.utc.iso8601)
        case entry.kind
        when 'assessment'
          input[:assessments] << values.merge(number: input[:assessments].size + 1, source_version: attempt[:version], facts: store[:sources].fetch(input_id).deep_dup, evidence_basis: ReviewEvidence.basis(store, input).deep_dup, evidence: ReviewEvidence.captured(store, input))
          event(review, "Assessment recorded: #{input[:captured][:name]}", CHOICES.fetch(entry.choice))
        when 'finding'
          input[:findings] << values.merge(assessment: input[:assessments].size, status: 'Open')
          event(review, "Finding recorded: #{input[:captured][:name]}", "Treatment owner: #{entry.owner}. Treatment remains open.")
        when 'completion'
          review[:completed_at] = values[:at]
          review[:conclusion] = values[:notes]
          event(review, 'Review completed', values[:notes])
        end
        attempt[:done] = true
        :recorded
      end
    end

    def self.simulate(key, action)
      LOCK.synchronize do
        store = WORKSPACES.fetch(key)
        case action
        when 'change'
          source = store[:sources].fetch(1)
          source[:version] += 1
          source[:owner] = source[:owner] == 'Jamie Chen' ? 'Robin Ellis' : 'Jamie Chen'
        when 'comparison_changes'
          source = store[:sources].fetch(1)
          source.merge!(owner: 'Robin Ellis', identifier: 'svc-backup-prod',
            scope: "Production recovery copies for the main workspace and regional reporting services.\nIncludes <Restricted> recovery material and the long-running reconciliation workload; access must remain limited to the named backup operators.",
            version: source[:version] + 1)
          source.delete(:legacy_reference)
        when 'comparison_unavailable' then store[:comparison_unavailable] = true
        when 'comparison_available' then store[:comparison_unavailable] = false
        when 'add'
          id = store[:sources].keys.max + 1
          store[:sources][id] = {id: id, name: "New monitoring account #{id}", owner: 'Robin Ellis', scope: 'Monitoring workspace', version: 1}
        when 'evidence_unavailable'
          artifact = store[:evidence].fetch(1)
          artifact[:content] = nil
          artifact[:version] += 1
        when 'failure' then store[:fail_next] = true
        when 'reset' then WORKSPACES[key] = seed
        end
      end
    end
  end
end
