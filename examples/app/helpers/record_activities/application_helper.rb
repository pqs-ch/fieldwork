module RecordActivities
  module ApplicationHelper
    def state_label(record)
      ServiceRequests::STATES.fetch(record[:phase])
    end

    def activity_label(key)
      { 'notes' => 'Notes', 'estimate' => 'Estimated cost (CHF)', 'supplier' => 'Supplier', 'order_reference' => 'Order reference', 'expected_on' => 'Expected delivery', 'installed_on' => 'Installed on', 'tested' => 'Installed and tested' }.fetch(key, key.humanize)
    end

    def activity_value(key, value)
      case key
      when 'tested' then value == '1' ? 'Confirmed' : 'Unconfirmed'
      when 'expected_on', 'installed_on'
        content_tag(:time, Date.iso8601(value).strftime('%-d %b %Y'), datetime: value)
      else value
      end
    end
  end
end
