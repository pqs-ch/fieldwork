module EventTimes
  module ApplicationHelper
    def wall_label(value)
      DateTime.strptime(value, '%Y-%m-%dT%H:%M').strftime('%-d %b %Y, %H:%M')
    end

    def utc_label(value) = Time.iso8601(value).utc.strftime('%-d %b %Y, %H:%M UTC')
    def date_label(value) = Date.iso8601(value).strftime('%-d %b %Y')
    def zone_label(record, kind)
      offset = record.fetch("#{kind}_offset".to_sym)
      abbreviation = record.fetch("#{kind}_abbreviation".to_sym)
      "#{record[:timezone]} · #{EventEntry.offset_label(offset)} · #{abbreviation}"
    end
  end
end
