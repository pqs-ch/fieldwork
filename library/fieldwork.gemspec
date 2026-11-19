Gem::Specification.new do |spec|
  spec.name = "fieldwork"
  spec.version = "0.3.0"
  spec.summary = "Shared UI contracts, styles, and native behavior for Rails applications"
  spec.authors = ["Fieldwork maintainers"]
  spec.homepage = "https://github.com/pqs-ch/fieldwork"
  spec.license = "Nonstandard"
  spec.metadata = {
    "source_code_uri" => "https://github.com/pqs-ch/fieldwork"
  }
  spec.required_ruby_version = ">= 3.2"
  spec.files = Dir.chdir(__dir__) do
    ["LICENSE", "LUCIDE-LICENSE", "index.md", "foundations.md", "rails.md", "feedback.md",
      *Dir["{elements,patterns}/**/*.md", "assets/fieldwork/**/*.{css,js,svg}", "rails/**/*.rb"]].sort
  end
  spec.require_paths = ["rails/lib"]
  spec.add_dependency "railties", ">= 8.1", "< 9"
  spec.add_dependency "actionview", ">= 8.1", "< 9"
  spec.add_dependency "propshaft", ">= 1.3", "< 2"
  spec.add_dependency "importmap-rails", ">= 2.2", "< 3"
  spec.add_dependency "turbo-rails", ">= 2", "< 3"
end
