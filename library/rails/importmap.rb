# Bare imports are the application API. URL pins also resolve the native relative
# imports inside fingerprinted modules, including imports from internal/.
prefix = File.join(Rails.application.config.relative_url_root.to_s,
  Rails.application.config.assets.prefix)
asset_host = Rails.application.config.asset_host

Dir[Fieldwork::ROOT.join("assets/fieldwork/**/*.js")].sort.each do |file|
  relative = Pathname.new(file).relative_path_from(Fieldwork::ROOT.join("assets")).to_s
  pin relative.delete_suffix(".js"), to: relative, preload: false
  pin "#{prefix}/#{relative}", to: relative, preload: false
  if asset_host.is_a?(String) && !asset_host.empty?
    pin "#{asset_host.chomp('/')}#{prefix}/#{relative}", to: relative, preload: false
  end
end
