module VersionedDocuments
  # Synthetic application data and rendering. Nothing here is part of the Fieldwork gem.
  require "open3"
  require "tempfile"
  require "thread"
  require "securerandom"
  module DocumentExamples
    SOURCE = <<~MARKDOWN
      # Working agreements for distributed project teams and external contributors

      ## Purpose
      Use this guidance to coordinate project work.
      Read the [workspace guide](/versioned-documents/documents/example).

      ## Working together
      - Share a short progress update.
        - Include the next milestone.
        - Mention risks and dependencies.
      - Keep decisions near the project.

      ## Response expectations and escalation when a teammate is unavailable
      Respond within five days.
      Keep a record of important decisions.
      Use the shared project workspace.
      Give each request a clear owner.
      State the date when a response is useful.
      Include relevant context with a request.
      Ask for help when work is blocked.
      Check availability before escalating.
      Keep urgent requests short.
      Review the contact list weekly.

      ## Access examples
      | Role | Project information | Financial planning and resource allocation |
      | --- | --- | --- |
      | Contributor | Read and update | Request access from the project owner |
      | Observer | Read | No access unless separately granted |

      Use `GET /projects` to retrieve the current list.

      ```text
      project: example
      access: limited
      ```

      ## Review cadence
      Review this guidance weekly.
      Discuss open questions with the team.
      Keep the review notes concise.
      Record decisions in the workspace.
      Link supporting material.
      Assign follow-up work.
      Check progress at the next meeting.

      Archive the temporary discussion channel.

      ## Contact
      Contact the support team for help.
    MARKDOWN
    V2 = SOURCE.sub("five days", "three days")
      .sub("Review this guidance weekly.", "Review this guidance **weekly**.")
      .sub("Archive the temporary discussion channel.\n", "")
      .sub("Contact the support team for help.", "Contact the support team for help.\n\nEscalate urgent access problems to the project owner.")
    PREVIEW_VARIANT = V2.sub("three days", "two days")
    MUTEX = Mutex.new
    PREVIEWS = {}
    REVISIONS = [
      { id: "r1", body: SOURCE.sub("five days", "seven days"), summary: "Initial working guidance", owner: "Jamie Chen", category: "Team guidance", at: "2026-10-01T09:00:00Z" },
      { id: "r2", body: SOURCE, summary: "Clarify response expectations", owner: "Alex Morgan", category: "Team guidance", at: "2026-10-08T10:00:00Z" },
      { id: "r3", body: V2, summary: "Shorten response time and clarify escalation", owner: "Sam Rivera", category: "Working agreements", at: "2026-10-19T11:00:00Z" },
      { id: "r4", body: V2, summary: "Recorded with no content or metadata changes", owner: "Sam Rivera", category: "Working agreements", at: "2026-10-20T12:00:00Z" }
    ]
    PUBLICATIONS = [{ name: "1.0", revision: "r1" }, { name: "1.1", revision: "r2" }].freeze

    INITIAL_REVISIONS = REVISIONS.deep_dup.freeze

    def self.reset
      MUTEX.synchronize do
        REVISIONS.replace(INITIAL_REVISIONS.deep_dup)
        PREVIEWS.clear
      end
    end

    def self.preview(values:, base:)
      MUTEX.synchronize do
        token = SecureRandom.hex(16)
        PREVIEWS.shift while PREVIEWS.size >= 64
        PREVIEWS[token] = { values: values.dup, base: base }
        token
      end
    end
    def self.preview_snapshot(token) = MUTEX.synchronize { PREVIEWS[token] }

    def self.revisions = MUTEX.synchronize { REVISIONS.map(&:dup) }
    def self.save(body:, summary:, base:, simulate_stale: false)
      MUTEX.synchronize do
        if simulate_stale
          REVISIONS << REVISIONS.last.merge(id: "r#{REVISIONS.length + 1}", summary: "Another editor saved", at: Time.now.utc.iso8601)
        end
        return nil unless REVISIONS.last[:id] == base
        revision = REVISIONS.last.merge(id: "r#{REVISIONS.length + 1}", body: body, summary: summary, owner: "You", at: Time.now.utc.iso8601)
        REVISIONS << revision
        revision.dup
      end
    end

    # Example application adapter to the host's diff command, not a library dependency.
    # Ask for full context, then fold unchanged regions for presentation.
    def self.comparison(earlier, later)
      Tempfile.create("earlier") do |a|
        Tempfile.create("later") do |b|
          a.write(earlier); a.flush; b.write(later); b.flush
          output, _, result = Open3.capture3("diff", "-U", "1000000", a.path, b.path)
          raise "Comparison unavailable" unless [0, 1].include?(result.exitstatus)
          return [] if result.exitstatus == 0
          old = 1; current = 1
          lines = output.lines.drop_while { |line| !line.start_with?("@@") }.drop(1).filter_map do |line|
            marker = line[0]
            next if marker == "\\"
            kind = { " " => "context", "+" => "added", "-" => "removed" }[marker]
            next unless kind
            item = { kind: kind, text: line[1..].delete_suffix("\n"), old: marker == "+" ? nil : old, later: marker == "-" ? nil : current }
            old += 1 unless marker == "+"; current += 1 unless marker == "-"
            item
          end
          visible = lines.each_index.select { |i| lines[i][:kind] != "context" }.flat_map { |i| (([0, i - 3].max)..([lines.length - 1, i + 3].min)).to_a }.to_h { |i| [i, true] }
          lines.chunk.with_index { |_, i| visible[i] ? :change : :context }.map { |kind, chunk| { kind: kind, lines: chunk } }
        end
      end
    end

    # Deliberately limited synthetic renderer: exact fixture Markdown has authored HTML.
    # Arbitrary edits are safely shown as escaped source in the separate preview.
    def self.renderable?(body) = [SOURCE, V2, PREVIEW_VARIANT, REVISIONS.first[:body]].include?(body)

    def self.rendered(body)
      return "<pre tabindex=\"0\" role=\"region\" aria-label=\"Escaped preview source\"><code>#{ERB::Util.html_escape(body)}</code></pre>" unless renderable?(body)
      revised = [V2, PREVIEW_VARIANT].include?(body)
      days = body.include?("two days") ? "two" : body.include?("seven days") ? "seven" : body.include?("three days") ? "three" : "five"
      <<~HTML
        <h2 id="purpose" tabindex="-1">Purpose</h2><p>Use this guidance to coordinate project work. Read the <a href="/versioned-documents/documents/example">workspace guide</a>.</p>
        <h2 id="working-together" tabindex="-1">Working together</h2><ul><li>Share a short progress update.<ul><li>Include the next milestone.</li><li>Mention risks and dependencies.</li></ul></li><li>Keep decisions near the project.</li></ul>
        <h2 id="response-expectations" tabindex="-1">Response expectations and escalation when a teammate is unavailable</h2><p>Respond within #{days} days.</p><p>Keep a record of important decisions. Use the shared project workspace. Give each request a clear owner. State the date when a response is useful. Include relevant context with a request. Ask for help when work is blocked. Check availability before escalating. Keep urgent requests short. Review the contact list weekly.</p>
        <h2 id="access" tabindex="-1">Access examples</h2><div class="rich-content-scroll" role="region" aria-label="Access examples table" tabindex="0"><table><caption>Example access</caption><thead><tr><th scope="col">Role</th><th scope="col">Project information</th><th scope="col">Financial planning and resource allocation</th></tr></thead><tbody><tr><td>Contributor</td><td>Read and update</td><td>Request access from the project owner</td></tr><tr><td>Observer</td><td>Read</td><td>No access unless separately granted</td></tr></tbody></table></div><p>Use <code>GET /projects</code> to retrieve the current list.</p><pre tabindex="0" role="region" aria-label="Example configuration"><code>project: example\naccess: limited</code></pre>
        <h2 id="review" tabindex="-1">Review cadence</h2><p>Review this guidance #{revised ? "<strong>weekly</strong>" : "weekly"}.</p><p>Discuss open questions with the team. Keep the review notes concise. Record decisions in the workspace. Link supporting material. Assign follow-up work. Check progress at the next meeting.#{revised ? "" : " Archive the temporary discussion channel."}</p>
        <h2 id="contact" tabindex="-1">Contact</h2><p>Contact the support team for help.</p>#{revised ? "<p>Escalate urgent access problems to the project owner.</p>" : ""}
      HTML
    end
  end
end
