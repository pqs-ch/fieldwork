module Operations
  require 'active_model'

  # Application-owned form object; Fieldwork supplies no project schema or validation.
  class OperationProject
    include ActiveModel::Model
    include ActiveModel::Attributes
    attribute :id, :integer
    attribute :name, :string
    attribute :description, :string
    attribute :owner, :string
    attribute :status, :string
    attribute :due_on, :string
    attribute :budget, :string
    attribute :version, :integer
    validates :name, :description, :due_on, presence: true
    validates :name, length: { maximum: 100 }
    validates :owner, inclusion: { in: ['Alex Morgan', 'Sam Rivera', 'Jamie Chen'] }
    validates :status, inclusion: { in: ['Planned', 'In progress', 'On hold', 'Completed'] }
    validates :budget, numericality: { greater_than_or_equal_to: 0 }
    validate do
      Date.iso8601(due_on) if due_on.present?
    rescue Date::Error
      errors.add(:due_on, 'must be a valid date')
    end
    def persisted? = id.present?
  end
end
