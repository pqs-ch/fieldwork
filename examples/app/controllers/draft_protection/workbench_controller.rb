module DraftProtection
  class WorkbenchController < ApplicationController
    INITIAL_TITLE = 'Supplier onboarding'.freeze
    INITIAL_NOTES = "Agree a shared onboarding checklist for Procurement and Finance, from supplier approval through the first invoice.\n\nConfirm who owns each handover and how the team will handle missing tax or payment details.".freeze
    before_action :load_baseline

    def show
      sleep 1 if params[:slow] == '1'
      @title, @notes = @baseline.values_at('title', 'notes')
    end

    def workspace
      @title, @notes = @baseline.values_at('title', 'notes')
    end
    def reference; end

    def save
      sleep 1 if params[:scenario] == 'slow'
      @title = params[:title].to_s
      @notes = params[:notes].to_s.gsub(/\r\n?/, "\n")
      @error = 'The service is unavailable. Your changes have not been saved. Try again.' if params[:scenario] == 'fail'
      @error ||= 'Enter a project name.' if @title.strip.empty?
      if @error
        respond_to do |format|
          format.json { render json: { message: @error }, status: :unprocessable_entity }
          format.html { @reselect = params[:files].present?; render :show, status: :unprocessable_entity }
        end
      else
        session[:draft_protection_brief_title] = @title
        session[:draft_protection_brief_notes] = @notes
        # Demonstration only: acknowledge actual multipart bytes without storing
        # customer documents or claiming permanent attachment storage.
        files = Array(params[:files]).reject(&:blank?).map { |file| { name: file.original_filename, bytes: file.read.bytesize } }
        upload_message = if files.any?
          'Received ' + files.map { |file| "#{file[:name]} (#{helpers.pluralize(file[:bytes], 'byte')})" }.join(', ') + '. This demonstration does not keep attachments.'
        end
        respond_to do |format|
          format.json { render json: { message: 'Project brief saved.', files: files, upload_message: upload_message } }
          format.html do
            flash[:upload_result] = upload_message
            redirect_to draft_protection_workbench_path(transport: params[:transport].presence, drive: params[:drive].presence), status: :see_other, notice: 'Project brief saved.'
          end
        end
      end
    end

    private

    def load_baseline
      @baseline = {
        'title' => session[:draft_protection_brief_title] || INITIAL_TITLE,
        'notes' => session[:draft_protection_brief_notes] || INITIAL_NOTES
      }
    end
  end
end
