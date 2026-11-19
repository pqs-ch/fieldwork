module PopulationReview
  class ReviewEntry
    include ActiveModel::Model
    include ActiveModel::Attributes
    attribute :kind, :string
    attribute :choice, :string, default: ''
    attribute :notes, :string, default: ''
    attribute :owner, :string, default: ''
    validates :choice, inclusion: { in: %w[satisfactory discrepancy excluded] }, if: -> { kind == 'assessment' }
    validates :notes, presence: true, length: { maximum: 2000 }
    validates :owner, presence: true, length: { maximum: 100 }, if: -> { kind == 'finding' }

    def persisted? = false
    def values = attributes.slice(*(kind == 'assessment' ? %w[choice notes] : kind == 'finding' ? %w[owner notes] : %w[notes]))
  end
end
