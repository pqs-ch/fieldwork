module RecordActivities
  require 'active_model'

  class RecordActivity
    include ActiveModel::Model
    include ActiveModel::Attributes
    attribute :kind, :string
    attribute :notes, :string, default: ''
    attribute :estimate, :string, default: ''
    attribute :supplier, :string, default: ''
    attribute :order_reference, :string, default: ''
    attribute :expected_on, :string, default: -> { (Date.current + 7).iso8601 }
    attribute :installed_on, :string, default: -> { Date.current.iso8601 }
    attribute :tested, :string, default: '0'
    validates :kind, inclusion: { in: %w[assessment order installation note] }
    validates :notes, presence: true, length: { maximum: 1200 }
    validates :estimate, numericality: { greater_than: 0 }, if: -> { kind == 'assessment' }
    validates :supplier, :order_reference, presence: true, if: -> { kind == 'order' }
    validates :tested, acceptance: { accept: '1' }, if: -> { kind == 'installation' }
    validate do
      field = kind == 'order' ? :expected_on : kind == 'installation' ? :installed_on : nil
      if field
        value = public_send(field)
        begin
          raise Date::Error unless value.to_s.match?(/\A\d{4}-\d{2}-\d{2}\z/)
          Date.iso8601(value)
        rescue Date::Error
          errors.add(field, 'must be a valid date')
        end
      end
    end

    def persisted? = false
    def values
      fields = case kind
      when 'assessment' then %w[notes estimate]
      when 'order' then %w[notes supplier order_reference expected_on]
      when 'installation' then %w[notes installed_on tested]
      else %w[notes]
      end
      attributes.slice(*fields)
    end
  end
end
