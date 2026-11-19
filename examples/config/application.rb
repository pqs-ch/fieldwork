require_relative "boot"
require "rails"
require "active_model/railtie"
require "action_controller/railtie"
require "action_view/railtie"
Bundler.require(*Rails.groups)

module FieldworkExamples
  class Application < Rails::Application
    config.load_defaults 8.1
    config.hosts = ["localhost", "127.0.0.1"]
    config.session_store :cookie_store, key: "_fieldwork_examples"
    config.secret_key_base = ENV.fetch("SECRET_KEY_BASE", "fieldwork-local-review-examples-only-" * 4)
    config.action_controller.allow_forgery_protection = true
    config.action_controller.include_all_helpers = false
  end
end
