# Inline only the SVGs bundled with Fieldwork; names never become filesystem paths.
module Fieldwork
  module IconHelper
    ICONS = Dir[File.expand_path("../assets/fieldwork/icons/*.svg", __dir__)].sort.to_h do |path|
      [File.basename(path, ".svg"), File.read(path).match(/<svg\b[^>]*>(.*)<\/svg>/m)[1].strip.freeze]
    end.freeze

    def fieldwork_icon(name, label: nil, **attributes)
      body = ICONS.fetch(name.to_s) { raise ArgumentError, "Unknown Fieldwork icon: #{name}" }
      attributes = {
        xmlns: "http://www.w3.org/2000/svg", width: 24, height: 24, viewBox: "0 0 24 24",
        fill: "none", stroke: "currentColor", "stroke-width": 2,
        "stroke-linecap": "round", "stroke-linejoin": "round"
      }.merge(attributes)
      attributes[:class] = class_names("icon", attributes[:class])
      attributes[:focusable] = "false"
      attributes[:role] = label.present? ? "img" : nil
      attributes[:aria] = (attributes[:aria] || {}).merge(
        hidden: label.present? ? nil : true, label: label.presence)
      tag.svg(body.html_safe, **attributes)
    end
  end
end
