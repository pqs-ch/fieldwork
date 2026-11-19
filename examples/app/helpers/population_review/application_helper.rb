module PopulationReview
  module ApplicationHelper
    def review_back_path = population_review_review_path(@review[:id], view: @view)
    def input_state(input) = PopulationReviews.state(@store, @review, input)
    def ready?(input) = PopulationReviews.ready?(@store, @review, input)
    def visible_inputs = (@review[:inputs] || []).select { |input| PopulationReviews.visible?(@store, @review, input, @view) }
    def review_status(review) = review[:completed_at] ? 'Completed' : review[:inputs] ? 'In progress' : 'Not started'
    def entry_title = {'assessment' => 'Assess account', 'finding' => 'Record finding', 'completion' => 'Complete review'}.fetch(@kind)
    def entry_submit = {'assessment' => 'Save assessment', 'finding' => 'Record finding', 'completion' => 'Complete review'}.fetch(@kind)

    def review_counts(review = @review)
      inputs = review[:inputs] || []
      states = inputs.map { |input| PopulationReviews.state(@store, review, input) }
      {total: inputs.size, reviewed: states.count('Reviewed'), excluded: states.count('Excluded'),
        outstanding: states.count { |state| !%w[Reviewed Excluded].include?(state) },
        findings: inputs.sum { |input| input[:findings].size }}
    end

    def state_tone(input)
      case input_state(input)
      when 'Changed facts', 'Finding required' then 'warning'
      when 'Reviewed' then 'success' if PopulationReviews.latest(input)[:choice] == 'satisfactory'
      end
    end

    def next_path(input)
      if input_state(input) == 'Finding required'
        population_review_review_finding_path(@review[:id], input[:id], view: @view)
      else
        population_review_review_assessment_path(@review[:id], input[:id], view: @view)
      end
    end

    def input_action(input)
      return 'View assessment' if @review[:completed_at] || ready?(input)
      return 'Record finding' if input_state(input) == 'Finding required'
      PopulationReviews.latest(input) ? 'Reassess account' : 'Assess account'
    end

    def input_action_path(input)
      @review[:completed_at] || ready?(input) ? population_review_review_input_path(@review[:id], input[:id], view: @view) : next_path(input)
    end

    def blocker_text(input)
      case input_state(input)
      when 'Changed facts' then 'Check the changed facts or evidence and record a new assessment.'
      when 'Finding required' then 'Record the issue, a treatment owner and a plan.'
      else 'Assess the account or explain why it is outside scope.'
      end
    end

    def evidence_date(artifact) = Date.iso8601(artifact[:evidence_date]).strftime('%-d %b %Y')

    def evidence_choices
      linked = ReviewEvidence.active(@input).map { |use| use[:artifact_id] }
      @store[:evidence].values.map do |file|
        available = ReviewEvidence.available?(file)
        already_linked = linked.include?(file[:id])
        state = !available ? ' · Unavailable' : already_linked ? ' · Already linked' : ''
        ["#{file[:name]} · #{file[:source]} · #{evidence_date(file)}#{state}", file[:id], {disabled: !available || already_linked}]
      end
    end

    def comparison_path(assessment)
      population_review_review_comparison_path(@review[:id], @input[:id], assessment: assessment[:number], view: @view)
    end

    def comparison_field(value)
      case value
      when true then 'Yes'
      when false then 'No'
      else value.to_s
      end
    end

    def timestamp(value)
      tag.time(Time.iso8601(value).utc.strftime('%-d %b %Y %H:%M UTC'), datetime: value)
    end
  end
end
