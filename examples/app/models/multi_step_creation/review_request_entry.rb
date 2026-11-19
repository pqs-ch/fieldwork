module MultiStepCreation
  require 'date'
  class ReviewRequestEntry
    include ActiveModel::Model
    FIELDS = %w[supplier owner purpose due_on approach assessor].freeze
    LABELS = { 'supplier' => 'Supplier name', 'owner' => 'Review owner', 'purpose' => 'What to review', 'due_on' => 'Review due date', 'approach' => 'Assessment approach', 'assessor' => 'Independent assessor' }.freeze
    OWNERS = { 'alex' => 'Alex Morgan', 'sam' => 'Sam Rivera' }.freeze
    attr_accessor(*FIELDS)
    validates :supplier, presence: true, length: { maximum: 80 }, on: :details
    validates :owner, inclusion: { in: OWNERS.keys, message: 'must be one of the available owners.' }, on: :details
    validates :purpose, presence: true, length: { maximum: 600 }, on: :scope
    validates :approach, inclusion: { in: %w[internal independent] }, on: :scope
    validates :assessor, presence: { message: 'is required for an independent assessment.' }, if: -> { approach == 'independent' }, on: :scope
    validates :assessor, length: { maximum: 80 }, if: -> { approach == 'independent' }, on: :scope
    validate :valid_due_date, on: :scope

    def initialize(values = {})
      super({ 'approach' => 'internal' }.merge(values.to_h.stringify_keys.slice(*FIELDS)))
    end

    def values
      FIELDS.to_h { |field| [field, public_send(field).to_s] }
    end

    def self.human_attribute_name(attribute, options = {})
      LABELS.fetch(attribute.to_s) { super }
    end

    def self.display(field, value)
      return 'Not entered' if value.blank?
      case field
      when 'owner' then OWNERS[value] || value
      when 'approach' then { 'internal' => 'Internal review', 'independent' => 'Independent assessment' }[value] || value
      else value
      end
    end

    def self.complete?(values)
      new(values).valid?(:details) && new(values).valid?(:scope)
    end

    private

    def valid_due_date
      raise Date::Error unless due_on.to_s.match?(/\A\d{4,}-\d{2}-\d{2}\z/)
      raise Date::Error unless Date.iso8601(due_on.to_s).year.positive?
    rescue Date::Error
      errors.add(:due_on, 'must be a valid calendar date.')
    end
  end
end
