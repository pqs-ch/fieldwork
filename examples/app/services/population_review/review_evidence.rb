module PopulationReview
  # Example-owned files and references. Originals are immutable, workspace-scoped,
  # process-local bytes; assessments retain reference metadata, never file copies.
  module ReviewEvidence
    def self.seed
      [
        [1, 'service-account-export.csv', 'Main workspace access inventory', '2026-10-20', "account,owner\nBackup automation,Jamie Chen\nDeployment robot,Sam Rivera\n"],
        [2, 'backup-safeguards.txt', 'Backup operations check', '2026-10-21', "Synthetic check: recovery copies are encrypted and access is limited.\n"],
        [3, 'release-permissions.csv', 'Release service permissions report', '2026-10-22', "account,permission\nDeployment robot,administrator\n"],
        [4, 'earlier-inventory.csv', 'Earlier access inventory', '2026-09-30', nil]
      ].to_h do |id, name, source, date, content|
        [id, {id: id, name: name, source: source, evidence_date: date, content: content,
          size: content&.bytesize || 320, added_at: '2026-10-23T08:00:00Z', actor: 'Alex Morgan', version: 1}]
      end
    end

    def self.active(input) = input.fetch(:evidence_uses, []).reject { |use| use[:removed_at] }
    def self.available?(artifact) = artifact && !artifact[:withdrawn_at] && !artifact[:content].nil?
    def self.availability(artifact) = artifact[:withdrawn_at] ? 'Withdrawn' : artifact[:content].nil? ? 'Unavailable' : 'Available'
    def self.basis(store, input)
      active(input).map { |use| [use[:id], store[:evidence].fetch(use[:artifact_id])[:version]] }
    end
    def self.captured(store, input)
      active(input).map do |use|
        {use_id: use[:id], purpose: use[:purpose], availability: availability(store[:evidence].fetch(use[:artifact_id])), artifact: store[:evidence].fetch(use[:artifact_id]).except(:content).deep_dup}
      end
    end
    def self.locations(store, artifact_id)
      store[:reviews].values.flat_map do |review|
        (review[:inputs] || []).filter_map do |input|
          {review: review, input: input} if active(input).any? { |use| use[:artifact_id] == artifact_id }
        end
      end
    end
    def self.target_basis(store, review, input)
      input ? [store[:sources].fetch(input[:id])[:version], basis(store, input)] : nil
    end

    def self.issue(key, kind, review_id: nil, input_id: nil, item_id: nil)
      PopulationReviews::LOCK.synchronize do
        store = PopulationReviews::WORKSPACES.fetch(key)
        review = store[:reviews][review_id]
        input = review && review[:inputs]&.find { |item| item[:id] == input_id }
        token = SecureRandom.uuid
        store[:evidence_attempts][token] = {kind: kind, review: review_id, input: input_id, item: item_id,
          locations: kind == 'withdraw' ? locations(store, item_id).map { |use| [use[:review][:id], use[:input][:id]] } : nil,
          basis: target_basis(store, review, input), versions: store[:evidence].transform_values { |file| file[:version] }}
        token
      end
    end

    def self.record(key, entry, token, review_id: nil, input_id: nil, item_id: nil)
      PopulationReviews::LOCK.synchronize do
        store = PopulationReviews::WORKSPACES.fetch(key)
        attempt = store[:evidence_attempts][token]
        return :expired unless attempt && attempt.values_at(:kind, :review, :input, :item) == [entry.kind, review_id, input_id, item_id]
        return :duplicate if attempt[:done]
        review = store[:reviews][review_id]
        input = review && review[:inputs]&.find { |item| item[:id] == input_id }
        if entry.kind != 'withdraw'
          return :conflict unless input && !review[:completed_at] && attempt[:basis] == target_basis(store, review, input)
        end
        artifact = store[:evidence][entry.kind == 'link' ? entry.artifact_id.to_i : item_id]
        if entry.kind == 'link'
          return :unavailable unless available?(artifact)
          return :conflict unless attempt[:versions][artifact[:id]] == artifact[:version]
          return :linked if active(input).any? { |use| use[:artifact_id] == artifact[:id] }
        elsif entry.kind == 'withdraw'
          return :conflict unless artifact && !artifact[:withdrawn_at] && attempt[:versions][item_id] == artifact[:version]
          return :conflict unless attempt[:locations] == locations(store, item_id).map { |use| [use[:review][:id], use[:input][:id]] }
        elsif entry.kind == 'remove'
          use = active(input).find { |item| item[:id] == item_id }
          return :conflict unless use
        end
        if store[:fail_next]
          store[:fail_next] = false
          return :failure
        end
        now = Time.now.utc.iso8601
        case entry.kind
        when 'upload'
          files = entry.files.map do |file|
            {name: File.basename(file.original_filename.tr('\\', '/'))[0, 255], content: file.read, size: file.size,
              source: entry.source, evidence_date: entry.evidence_date, actor: 'Alex Morgan', added_at: now, version: 1,
              origin: {review: review_id, input: input_id}}
          end
          files.each do |file|
            id = store[:evidence].keys.max.to_i + 1
            store[:evidence][id] = file.merge(id: id)
            add_use(input, id, entry.purpose, now)
          end
          PopulationReviews.event(review, 'Evidence added', "#{files.size} uploaded files linked to #{input[:captured][:name]}.")
        when 'link'
          add_use(input, artifact[:id], entry.purpose, now)
          PopulationReviews.event(review, 'Existing evidence linked', "#{artifact[:name]} supports #{input[:captured][:name]}.")
        when 'remove'
          use[:removed_at] = now
          PopulationReviews.event(review, 'Evidence link removed', "#{store[:evidence].fetch(use[:artifact_id])[:name]} removed from #{input[:captured][:name]}. The original and earlier assessment references are retained.")
        when 'withdraw'
          artifact.merge!(withdrawn_at: now, withdrawal_reason: entry.reason, version: artifact[:version] + 1)
          locations(store, item_id).group_by { |location| location[:review][:id] }.each_value do |uses|
            PopulationReviews.event(uses.first[:review], 'Original evidence withdrawn', "#{artifact[:name]}: #{entry.reason} Affected accounts: #{uses.map { |use| use[:input][:captured][:name] }.join(', ')}.")
          end
        end
        attempt[:done] = true
        :recorded
      end
    end

    def self.add_use(input, artifact_id, purpose, now)
      input[:evidence_uses] << {id: SecureRandom.hex(8), artifact_id: artifact_id, purpose: purpose, linked_at: now, actor: 'Alex Morgan'}
    end
  end
end
