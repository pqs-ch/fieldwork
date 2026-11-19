module PopulationReview
  class EvidenceEntry
    include ActiveModel::Model
    include ActiveModel::Attributes
    attribute :kind, :string
    attribute :artifact_id, :string, default: ''
    attribute :source, :string, default: ''
    attribute :evidence_date, :string, default: ''
    attribute :purpose, :string, default: ''
    attribute :reason, :string, default: ''
    attr_accessor :files

    validates :purpose, presence: true, length: {maximum: 1200}, if: -> { %w[upload link].include?(kind) }
    validates :source, presence: true, length: {maximum: 200}, if: -> { kind == 'upload' }
    validates :artifact_id, presence: true, if: -> { kind == 'link' }
    validates :reason, presence: true, length: {maximum: 1200}, if: -> { kind == 'withdraw' }
    validate do
      next unless kind == 'upload'
      uploads = Array(files)
      errors.add(:files, 'must include between 1 and 5 files') unless (1..5).cover?(uploads.size)
      uploads.each do |file|
        if !file.respond_to?(:original_filename) || !%w[.txt .csv .pdf].include?(File.extname(file.original_filename).downcase)
          errors.add(:files, 'must be TXT, CSV or PDF files')
        elsif file.size.zero? || file.size > 2.megabytes
          errors.add(:files, "includes an empty file or a file larger than 2 MB: #{file.original_filename}")
        end
      end
      begin
        raise Date::Error unless evidence_date.to_s.match?(/\A\d{4}-\d{2}-\d{2}\z/)
        errors.add(:evidence_date, 'cannot be in the future') if Date.iso8601(evidence_date.to_s) > Date.current
      rescue Date::Error
        errors.add(:evidence_date, 'must be a valid date')
      end
    end

    def persisted? = false
    def values = attributes.slice(*case kind
      when 'upload' then %w[source evidence_date purpose]
      when 'link' then %w[artifact_id purpose]
      when 'withdraw' then %w[reason]
      else []
      end)
  end
end
