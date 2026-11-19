# Optional Rails view helper. Rails supplies form submission, CSRF, and validation.
# The generated HTML also works without Fieldwork JavaScript or Turbo.
module Fieldwork
  module FormHelper
    def fieldwork_form_with(baseline: nil, message: nil, error: nil,
      mode: :edit, composition: :fixed, submit_label: nil, pending_label: nil, discard_label: "Discard changes", cancel: nil, actions: nil, actions_position: :end, **options, &block)
      raise ArgumentError, "Form mode must be edit or create" unless [:edit, :create].include?(mode.to_sym)
      raise ArgumentError, "Composition must be fixed or mixed" unless [:fixed, :mixed].include?(composition.to_sym)
      actions_position = actions_position.to_sym
      raise ArgumentError, "Actions position must be start or end" unless [:start, :end].include?(actions_position)
      starting_actions = actions_position == :start
      creating = mode.to_sym == :create
      submit_label ||= creating ? "Create record" : "Save changes"
      model = options[:model]
      invalid = model.respond_to?(:errors) && model.errors.any?
      failed = invalid || error.present?
      scope = options[:scope] || (model && model.model_name.param_key)
      data = (options[:data] || {}).merge(fieldwork_editing: true)
      data[:editing_pending_label] = pending_label if pending_label.present?
      data[:form_mode] = "create" if creating
      data[:form_composition] = "mixed" if composition.to_sym == :mixed
      if baseline
        data[:editing_baseline] = baseline.to_h.to_h do |name, value|
          values = value == true ? ["1"] : value == false ? [] : Array(value).map(&:to_s)
          [scope ? "#{scope}[#{name}]" : name.to_s, values]
        end.to_json
      end
      data[:editing_result] = failed ? "invalid" : "saved" if failed || message
      options[:data] = data
      form_with(**options) do |builder|
        content = capture(builder, &block)
        controls = if actions
          capture(builder, &actions)
        else
          safe_join([
            (button_tag(discard_label, type: "reset", class: "button", hidden: true) unless creating),
            button_tag(submit_label, type: "submit", class: "button", data: { intent: "primary" })
          ].compact)
        end
        position_data = starting_actions ? { position: "start" } : {}
        field_stack = content_tag(:div, content, class: "stack", data: { gap: "section" })
        action_row = content_tag(:div, class: "form-actions", data: position_data) do
          safe_join([
            content_tag(:p, "", class: "hint", data: { form_changes: true }, role: "status", aria: { atomic: true }, hidden: creating),
            (link_to("Cancel", cancel, class: "button") if cancel),
            controls
          ].compact)
        end
        fields = content_tag(:fieldset, data: { form_fields: true }) do
          safe_join(starting_actions ? [action_row, field_stack] : [field_stack, action_row])
        end
        status = content_tag(:p, error || message || (invalid ? "Check the highlighted fields and try again." : ""),
          class: "notice", data: { form_status: true, tone: failed ? "error" : message ? "success" : "neutral" }.merge(position_data),
          role: "status", aria: { atomic: true }, tabindex: -1)
        safe_join(starting_actions ? [status, fields] : [fields, status])
      end
    end

    def fieldwork_field(builder, attribute, type: :text, label: nil, hint: nil, **options)
      method = type == :textarea ? :text_area : "#{type}_field"
      fieldwork_control(builder, attribute, label: label, hint: hint, **options) do |control_options|
        builder.public_send(method, attribute, **control_options)
      end
    end

    def fieldwork_select(builder, attribute, choices, label: nil, hint: nil,
      include_blank: nil, prompt: nil, select_options: {}, **options)
      select_options = select_options.merge(include_blank: include_blank) unless include_blank.nil?
      select_options = select_options.merge(prompt: prompt) unless prompt.nil?
      fieldwork_control(builder, attribute, label: label, hint: hint, **options) do |control_options|
        builder.select(attribute, choices, select_options, control_options)
      end
    end

    private

    def fieldwork_control(builder, attribute, label: nil, hint: nil, **options)
      id = options[:id] || builder.field_id(attribute)
      error = builder.object.respond_to?(:errors) ? builder.object.errors&.full_messages_for(attribute)&.join(". ") : nil
      described_by = [options.dig(:aria, :describedby), ("#{id}-hint" if hint), "#{id}-error"].compact.join(" ").split.uniq.join(" ")
      options = options.merge(id: id, aria: (options[:aria] || {}).merge(describedby: described_by, invalid: error.present?))
      content_tag(:div, class: "field") do
        safe_join([
          builder.label(attribute, label, for: id),
          yield(options),
          (content_tag(:p, hint, class: "hint", id: "#{id}-hint") if hint),
          content_tag(:p, error, class: "field-error", id: "#{id}-error", hidden: error.blank?, data: { field_error_for: id })
        ].compact)
      end
    end
  end
end
