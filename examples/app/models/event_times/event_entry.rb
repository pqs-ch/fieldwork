module EventTimes
  require 'digest'
  require 'tzinfo'

  # Calendar/timezone semantics belong to this example. Native datetime-local
  # values are wall-clock fields, never browser- or server-local instants.
  class EventEntry
    include ActiveModel::Model
    include ActiveModel::Attributes
    ZONES = {
      'Europe/Zurich' => 'Zürich — Europe/Zurich',
      'America/New_York' => 'New York — America/New_York',
      'Asia/Kolkata' => 'Kolkata — Asia/Kolkata',
      'Etc/UTC' => 'UTC — Etc/UTC'
    }.freeze
    TARGET_HOURS = 4
    LABELS = {subject: 'Event', local_time: 'Event local time', timezone: 'Event timezone', review_on: 'Review by', occurrence: 'Occurrence'}.freeze
    attribute :subject, :string, default: ''
    attribute :local_time, :string, default: ''
    attribute :timezone, :string, default: 'Europe/Zurich'
    attribute :review_on, :string, default: ''
    attribute :occurrence, :string, default: ''
    attribute :occurrence_basis, :string, default: ''
    attr_reader :candidates, :resolved

    validates :subject, presence: true, length: {maximum: 200}
    validates :timezone, inclusion: {in: ZONES.keys, message: 'must be one of the listed timezones'}
    validate :resolve_event
    validate :validate_review_date

    def persisted? = false
    def self.human_attribute_name(name, options = {}) = LABELS[name.to_sym] || super
    def values = attributes
    def resolution_basis = Digest::SHA256.hexdigest([local_time, timezone].to_json)

    def self.offset_label(seconds)
      sign = seconds.negative? ? '-' : '+'
      hours, remainder = seconds.abs.divmod(3600)
      "UTC#{sign}#{format('%02d:%02d', hours, remainder / 60)}"
    end

    private

    def resolve_event
      @candidates = []
      @resolved = nil
      return unless ZONES.key?(timezone)
      parts = local_time.to_s.match(/\A(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})\z/)
      begin
        raise Date::Error unless parts
        date = Date.iso8601(parts[1])
        raise Date::Error unless date.year.positive?
        hour, minute = parts[2].to_i, parts[3].to_i
        raise Date::Error unless (0..23).cover?(hour) && (0..59).cover?(minute)
        wall = Time.utc(date.year, date.month, date.day, hour, minute)
      rescue Date::Error, ArgumentError, RangeError
        errors.add(:local_time, 'must be a valid local date and time')
        return
      end
      zone = TZInfo::Timezone.get(timezone)
      @candidates = zone.periods_for_local(wall).map do |period|
        {offset: period.utc_total_offset, abbreviation: period.abbreviation.to_s,
          utc: Time.at(wall.to_i - period.utc_total_offset).utc}
      end.sort_by { |candidate| candidate[:utc] }
      if candidates.empty?
        errors.add(:local_time, "does not exist in #{timezone} because the clock moves forward. Choose a different local time.")
        return
      end
      self.occurrence = '' if candidates.size > 1 && occurrence_basis != resolution_basis
      candidate = if candidates.one?
        candidates.first
      elsif occurrence_basis == resolution_basis
        candidates.find { |item| item[:offset].to_s == occurrence }
      end
      unless candidate
        errors.add(:occurrence, 'must be selected for this repeated clock time')
        return
      end
      if candidate[:utc] > Time.now.utc
        errors.add(:local_time, 'must be an event time that has already occurred')
        return
      end
      self.occurrence = candidate[:offset].to_s
      self.occurrence_basis = resolution_basis
      target = candidate[:utc] + TARGET_HOURS.hours
      target_local = zone.utc_to_local(target)
      @resolved = {
        event_at: candidate[:utc].iso8601, event_local: local_time, timezone: timezone,
        event_offset: candidate[:offset], event_abbreviation: candidate[:abbreviation],
        target_at: target.iso8601, target_local: target_local.strftime('%Y-%m-%dT%H:%M'),
        target_offset: target_local.utc_offset, target_abbreviation: target_local.zone.to_s,
        target_hours: TARGET_HOURS
      }
    end

    def validate_review_date
      begin
        raise Date::Error unless review_on.to_s.match?(/\A\d{4}-\d{2}-\d{2}\z/)
        raise Date::Error unless Date.iso8601(review_on).year.positive?
      rescue Date::Error
        errors.add(:review_on, 'must be a valid calendar date')
      end
    end
  end
end
