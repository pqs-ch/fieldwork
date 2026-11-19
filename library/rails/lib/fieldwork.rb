require "pathname"
require "rails/railtie"
require_relative "../form_helper"
require_relative "../icon_helper"

module Fieldwork
  ROOT = Pathname.new(__dir__).join("../..").expand_path.freeze

  class Railtie < Rails::Railtie
    initializer "fieldwork.assets", before: "propshaft.assets_middleware" do |app|
      app.config.assets.paths << ROOT.join("assets")
    end

    initializer "fieldwork.importmap", before: "importmap" do |app|
      app.config.importmap.paths << ROOT.join("rails/importmap.rb")
      app.config.importmap.cache_sweepers << ROOT.join("assets/fieldwork")
    end

    initializer "fieldwork.helpers" do
      ActiveSupport.on_load(:action_controller_base) do
        helper Fieldwork::FormHelper
        helper Fieldwork::IconHelper
      end
    end

    generators do
      require_relative "generators/fieldwork/install_generator"
    end
  end
end
