module VersionedDocuments
  class DocumentExamplesController < ApplicationController
    layout "versioned_documents/layouts/document_examples"
    before_action :load_data
    helper_method :example_url, :revision_label, :line_markup

    def example_url(action = "read", **options)
      "/versioned-documents/documents/example/#{action}?#{options.to_query}"
    end

    def revision_label(revision)
      publication = DocumentExamples::PUBLICATIONS.find { |item| item[:revision] == revision[:id] }
      "Saved revision #{revision[:id].delete_prefix('r')}#{publication ? " · Published #{publication[:name]}" : ''}"
    end

    def read
      @revision = params[:revision].present? ? @revisions.find { |r| r[:id] == params[:revision] } : @published
      return head :not_found unless @revision
      @publication = DocumentExamples::PUBLICATIONS.find { |p| p[:revision] == @revision[:id] }
      @historical = @publication && @revision[:id] != @published[:id]
      @historical_saved = !@publication && @revision[:id] != @draft[:id]
      @unpublished = params[:unpublished] == "1"
      @has_sections = DocumentExamples.renderable?(@revision[:body])
      @html = DocumentExamples.rendered(@revision[:body])
      render "versioned_documents/documents/read"
    end

    def compare
      @earlier = @revisions.find { |r| r[:id] == params[:earlier] }
      @later = @revisions.find { |r| r[:id] == params[:later] }
      @state = if params[:unavailable] == "1" || !@later || (params[:earlier].present? && !@earlier) || (!@earlier && @later != @revisions.first)
        "unavailable"
      elsif !@earlier
        "first"
      else
        begin
          @segments = DocumentExamples.comparison(@earlier[:body], @later[:body])
          @segments.empty? ? "identical" : "changed"
        rescue SystemCallError, RuntimeError
          "unavailable"
        end
      end
      render "versioned_documents/documents/compare"
    end

    def edit
      @values = { body: @draft[:body], summary: "" }
      @base = @draft[:id]
      if params[:preview].present?
        snapshot = DocumentExamples.preview_snapshot(params[:preview])
        return head :not_found unless snapshot
        @values = snapshot[:values].dup
        @base = snapshot[:base]
        @baseline_revision = @revisions.find { |r| r[:id] == @base }
        @preview = DocumentExamples.rendered(@values[:body].to_s)
      end
      render "versioned_documents/documents/edit"
    end

    def update
      @values = params.require(:document).permit(:body, :summary).to_h.symbolize_keys
      # Native textarea submissions use CRLF; the editor stores logical lines as LF.
      @values[:body] = @values[:body].to_s.gsub(/\r\n?/, "\n")
      @base = params[:recovery_base].presence || params[:base_revision]
      @baseline_revision = @revisions.find { |r| r[:id] == @base } || @draft
      if params[:intent] == "preview"
        token = DocumentExamples.preview(values: @values, base: @base)
        redirect_to example_url("edit", preview: token), status: :see_other
      elsif @values[:body].blank? || @values[:summary].blank?
        @error = "Enter document text and a change summary. Your attempted text is retained."
        @summary_error = "Enter a change summary." if @values[:summary].blank?
        render "versioned_documents/documents/edit", status: :unprocessable_entity
      else
        saved = DocumentExamples.save(**@values, base: @base, simulate_stale: params[:intent] == "stale")
        if saved
          redirect_to example_url("read", revision: saved[:id]), notice: "Draft saved. Published version 1.1 is unchanged.", status: :see_other
        else
          @conflict = true
          @error = "A newer saved revision exists. Your submitted text is retained; nothing was overwritten."
          @latest = DocumentExamples.revisions.last
          render "versioned_documents/documents/edit", status: :conflict
        end
      end
    end

    def history
      render "versioned_documents/documents/history"
    end

    def restore
      source = @revisions.find { |r| r[:id] == params[:revision] }
      return head :not_found unless source
      saved = DocumentExamples.save(body: source[:body], summary: "Restored from #{source[:id]}", base: @draft[:id])
      return head :conflict unless saved
      redirect_to example_url("read", revision: saved[:id]), notice: "Restored into a new saved draft revision.", status: :see_other
    end

    # Static word-level data for the synthetic wording/formatting changes only.
    # All other lines use whole-line changes; no invented word matching.
    def line_markup(line)
      text = line[:text]
      unless DocumentExamples.renderable?(@earlier[:body]) && DocumentExamples.renderable?(@later[:body])
        return ERB::Util.html_escape(text)
      end
      words = ["five", "three", "seven", "two", "**weekly**"]
      word = words.find { |candidate| text.include?(candidate) }
      return ERB::Util.html_escape(text) if line[:kind] == "context" || !word
      before, after = text.split(word, 2)
      helpers.safe_join([before, helpers.content_tag(line[:kind] == "added" ? :ins : :del, word), after])
    end

    private
    def load_data
      @revisions = DocumentExamples.revisions
      @draft = @revisions.last
      @published = @revisions.find { |r| r[:id] == DocumentExamples::PUBLICATIONS.last[:revision] }
    end
  end
end
