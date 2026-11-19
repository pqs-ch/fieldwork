require "rails/generators"
require "pathname"

module Fieldwork
  class InstallGenerator < Rails::Generators::Base
    desc "Install Fieldwork styles, Turbo forms, and the agent reference."

    def verify_setup
      layout = Pathname.new(destination_root).join("app/views/layouts/application.html.erb")
      javascript = Pathname.new(destination_root).join("app/javascript/application.js")
      unless layout.file? && javascript.file? &&
          layout.read.include?("javascript_importmap_tags") &&
          layout.read.match?(/<%= stylesheet_link_tag/) &&
          javascript.read.include?("@hotwired/turbo-rails")
        raise Thor::Error, "Fieldwork expects an ERB application layout with stylesheet_link_tag and javascript_importmap_tags, and Turbo loaded in app/javascript/application.js. Set up Propshaft, importmap, and Turbo first."
      end
    end

    def install_styles
      layout = "app/views/layouts/application.html.erb"
      return if File.read(Pathname.new(destination_root).join(layout)).include?('stylesheet_link_tag "fieldwork/ui"')

      inject_into_file layout, before: /[ \t]*<%= stylesheet_link_tag/ do
        "    <%= stylesheet_link_tag \"fieldwork/ui\", \"fieldwork/tables\", \"data-turbo-track\": \"reload\" %>\n"
      end
    end

    def install_javascript
      path = "app/javascript/application.js"
      return if File.read(Pathname.new(destination_root).join(path)).include?('from "fieldwork/turbo"')

      append_to_file path, "\nimport { installTurboEditing } from \"fieldwork/turbo\"\ninstallTurboEditing()\n"
    end

    def install_agent_reference
      path = "AGENTS.md"
      entry = "Before building UI, run `bundle show fieldwork` from the application root and read `index.md` in that directory. Follow its owning contracts and treat the installed gem as read-only.\n"
      if File.exist?(Pathname.new(destination_root).join(path))
        # Migrate the old generated checkout link without touching other agent instructions.
        gsub_file path, /^Before building UI, read \[Fieldwork\]\([^\n]*\) and follow its owning contracts\.\r?\n?/, entry
        append_to_file path, "\n#{entry}" unless File.read(Pathname.new(destination_root).join(path)).include?(entry.strip)
      else
        create_file path, entry
      end
    end
  end
end
