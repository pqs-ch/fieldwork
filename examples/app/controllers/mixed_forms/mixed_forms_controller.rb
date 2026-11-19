module MixedForms
  # Synthetic data and failure scenarios belong to this app, never the library.
  class MixedFormsController < ApplicationController
    STORE = {}
    PEOPLE = [ ["alex", "Alex Morgan"], ["jamie", "Jamie Chen"], ["sam", "Sam Rivera"], ["lee", "Lee Patel"] ].freeze
    INITIAL = { "title" => "Website refresh", "owner_id" => "alex", "reviewer_ids" => ["jamie"], "dates_required" => false,
      "deliverables" => {
        "0" => { "title" => "Content inventory and ownership", "due_on" => "2026-11-06" },
        "1" => { "title" => "Navigation prototype", "due_on" => "2026-11-12" },
        "2" => { "title" => "Accessibility review and launch checklist", "due_on" => "2026-11-19" }
      }, "attachments" => [] }.freeze

    def edit
      prepare(saved.deep_dup)
    end

    def update
      draft = params.fetch(:project, {}).permit(:title, :owner_id, :dates_required, reviewer_ids: [], deliverables: {}).to_h
      draft["dates_required"] = draft["dates_required"] == "1"
      draft["reviewer_ids"] = Array(draft["reviewer_ids"]).reject(&:blank?)
      draft["deliverables"] ||= {}
      draft["attachments"] = saved["attachments"]
      files = Array(params[:files]).select { |file| file.respond_to?(:original_filename) }
      notes = Array(params[:descriptions])
      file_metadata = files.each_with_index.map { |file, index| { "name" => file.original_filename, "description" => notes[index].to_s } }
      # Notes describe lost browser choices; they never stand in for uploaded files.
      previous_files = params.permit(previous_files: [:name, :description]).fetch(:previous_files, []).map(&:to_h)
      @previous_files = previous_files + file_metadata
      intent = params[:intent]
      @errors = {}
      if intent == 'add'
        key = ((draft['deliverables'].keys.map(&:to_i).max || -1) + 1).to_s
        draft['deliverables'][key] = { 'title' => '', 'due_on' => '' }
        @focus_id = "deliverable-#{key}-title"
        prepare(draft, reselect: @previous_files.any?)
        return render :edit
      elsif intent.present?
        action, key = intent.split(':', 2)
        unless ['remove', 'confirm_remove', 'keep'].include?(action) && draft['deliverables'].key?(key)
          @failure_message = 'That deliverable is no longer in this draft. Nothing was saved or removed.'
          prepare(draft, reselect: @previous_files.any?)
          return render :edit, status: :unprocessable_content
        end
        @removing_key = key
        if action == 'remove'
          prepare(draft, reselect: @previous_files.any?)
          return render :remove
        elsif action == 'keep'
          @focus_id = "native-remove-#{key}"
        else
          keys = draft['deliverables'].keys
          index = keys.index(key)
          next_key = keys[index + 1] || keys[index - 1] unless keys.length == 1
          draft['deliverables'].delete(key)
          @focus_id = next_key ? "deliverable-#{next_key}-title" : 'native-add-deliverable'
          @draft_notice = params[:mode] == 'create' ? 'Deliverable removed from the draft. Create project to record the brief.' : 'Deliverable removed from the draft. Save project to update the saved brief.'
        end
        prepare(draft, reselect: @previous_files.any?)
        return render :edit
      end
      @errors["title"] = "Enter a project name." if draft["title"].to_s.strip.empty?
      @errors["reviewer_ids"] = "Choose at least one reviewer." if draft["reviewer_ids"].empty?
      draft["deliverables"].each do |key, row|
        @errors["due-#{key}"] = "Enter a due date." if draft["dates_required"] && row["due_on"].blank?
        @errors["deliverable-#{key}"] = "Enter a deliverable title." if row["title"].to_s.strip.empty?
      end
      allowed = PEOPLE.map(&:first)
      @errors["reviewer_ids"] = "Choose available reviewers." unless (draft["reviewer_ids"] - allowed).empty?
      failure = session.delete(:mixed_forms_mixed_failure)
      if failure || @errors.any?
        message = failure == "unavailable" ? "Could not save the project. Try again." : "Check the highlighted details."
        status = failure == "unavailable" ? :service_unavailable : :unprocessable_content
        if request.format.json?
          details = @errors.map do |field, error|
            label = case field
            when 'title' then 'Project name'
            when 'reviewer_ids' then 'Reviewers'
            else
              kind, key = field.split('-', 2)
              number = draft['deliverables'].keys.index(key).to_i + 1
              "Deliverable #{number} — #{kind == 'due' ? 'Due date' : 'Title'}"
            end
            "#{label}: #{error}"
          end
          # In-place failure keeps the live file queue; its feedback must name the
          # rejected fields rather than promise server-rendered highlights.
          message = details.any? ? details.join(' ') : 'Could not save the project. Your entries are retained. Try again.'
          return render json: { message: message }, status: status
        end
        prepare(draft, reselect: @previous_files.any?)
        @failure_message = message
        return render :edit, status: status
      end
      draft["attachments"] += file_metadata
      session[:mixed_forms_mixed_project_key] ||= SecureRandom.hex(12)
      STORE[session[:mixed_forms_mixed_project_key]] = draft
      if request.format.json?
        render json: { attachments: draft["attachments"] }
      else
        redirect_to "/mixed-forms/mixed-form", status: :see_other, notice: "Project saved."
      end
    end

    def fail_next
      session[:mixed_forms_mixed_failure] = params[:kind] == "validation" ? "validation" : "unavailable"
      head :no_content
    end

    def people
      if params[:q] == "failure"
        return render json: {}, status: :service_unavailable
      end
      items = PEOPLE.select { |_, label| label.downcase.include?(params[:q].to_s.downcase) }
      render json: { items: items.map { |id, label| { value: id, label: label, description: "Project team" } }, hasMore: false }
    end

    def other
      render :other
    end

    private

    def saved
      STORE[session[:mixed_forms_mixed_project_key]] || INITIAL.deep_dup
    end

    def prepare(draft, reselect: false)
      @saved = saved.deep_dup
      @draft = draft
      @errors ||= {}
      @reselect = reselect
      @people = PEOPLE
    end
  end
end
