module PopulationReview
  # This application's field meanings and matching rules. Fieldwork only presents
  # the supplied rows; it neither computes differences nor decides reassessment.
  class AssessmentComparison
    FIELDS = {
      name: 'Account name', owner: 'Owner', scope: 'Operating scope',
      identifier: 'Account identifier', legacy_reference: 'Legacy reference',
      interactive_sign_in: 'Interactive sign-in', active_sessions: 'Active sessions'
    }.freeze
    attr_reader :assessment

    def initialize(store:, input:, assessment:)
      @store, @input, @assessment = store, input, assessment
    end

    def rows
      @rows ||= FIELDS.map do |key, label|
        row(key.to_s, label, normalize(assessment[:facts][key]), normalize(@store[:sources].fetch(@input[:id])[key]))
      end + evidence_rows
    end

    def changes = rows.reject { |item| item[:change] == 'unchanged' }
    def unchanged = rows.select { |item| item[:change] == 'unchanged' }

    private

    def normalize(value) = value == '' ? nil : value

    def row(key, label, before, after, type: :field)
      change = if before == after then 'unchanged'
      elsif before.nil? then 'added'
      elsif after.nil? then 'removed'
      else 'changed'
      end
      {key: key, label: label, before: before, after: after, change: change, type: type}
    end

    def evidence_rows
      before = assessment.fetch(:evidence, []).to_h { |reference| [reference[:artifact][:id], evidence_value(reference)] }
      after = ReviewEvidence.captured(@store, @input).to_h { |reference| [reference[:artifact][:id], evidence_value(reference)] }
      (before.keys | after.keys).map do |id|
        row("evidence-#{id}", "Evidence · #{(before[id] || after[id])[:name]}", before[id], after[id], type: :evidence)
      end
    end

    def evidence_value(reference)
      reference[:artifact].slice(:name, :source, :evidence_date).merge(purpose: reference[:purpose], availability: reference[:availability])
    end
  end
end
