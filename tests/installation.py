"""Install the library from a checkout in a fresh generated Rails application."""
import os
from pathlib import Path
import shutil
import subprocess
from workspace import ROOT


def run(app, *arguments, bundle_root=None):
    result = subprocess.run(arguments, cwd=app, env={**os.environ,
        'BUNDLE_GEMFILE': str((bundle_root or app) / 'Gemfile'), 'BUNDLE_FROZEN': 'true'},
        text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if result.returncode:
        raise RuntimeError(' '.join(arguments) + '\n' + result.stdout)
    return result.stdout


def prepare(directory):
    app = directory / 'installation'
    bundle = ROOT / 'examples'
    # Use rails new, keeping the actual Rails asset/importmap/Turbo setup. Omit
    # unrelated services and development tooling from this temporary smoke app.
    run(directory, 'bundle', 'exec', 'rails', 'new', str(app), '--name=InstallationCheck',
        '--no-rc', '--skip-git', '--skip-bundle', '--skip-docker', '--skip-kamal',
        '--skip-solid', '--skip-ci', '--skip-dev-gems', '--skip-rubocop', '--skip-brakeman',
        '--skip-bundler-audit', '--skip-thruster', '--skip-bootsnap', '--skip-test',
        '--skip-keeps', '--skip-jbuilder', '--skip-action-mailer', '--skip-action-mailbox',
        '--skip-action-text', '--skip-active-job', '--skip-active-storage', '--skip-action-cable',
        '--skip-active-record', '--skip-stimulus', bundle_root=bundle)
    # Recreate the submodule's library layout from the source under review and
    # reuse the examples' resolved Rails dependencies for an offline check.
    dependency = 'vendor/fieldwork/library'
    shutil.copytree(ROOT / 'library', app / dependency)
    gemfile = (bundle / 'Gemfile').read_text().replace('path: "../library"', f'path: "{dependency}"')
    lock = (bundle / 'Gemfile.lock').read_text().replace('  remote: ../library\n', f'  remote: {dependency}\n', 1)
    (app / 'Gemfile').write_text(gemfile)
    (app / 'Gemfile.lock').write_text(lock)
    run(app, 'bundle', 'install', '--local')
    reference = run(app, 'bundle', 'show', 'fieldwork').strip().splitlines()[-1]
    assert Path(reference).resolve() == (app / dependency).resolve(), 'Fieldwork was not loaded from the checkout'
    for task in ['importmap:install', 'turbo:install']:
        run(app, 'ruby', 'bin/rails', task)
    (app / 'AGENTS.md').write_text('Keep application instructions.\nBefore building UI, read [Fieldwork](vendor/fieldwork/library/index.md) and follow its owning contracts.\n')
    run(app, 'ruby', 'bin/rails', 'generate', 'fieldwork:install')
    installed = {path: (app / path).read_bytes() for path in [
        'app/views/layouts/application.html.erb', 'app/javascript/application.js', 'AGENTS.md']}
    run(app, 'ruby', 'bin/rails', 'generate', 'fieldwork:install')
    assert all((app / path).read_bytes() == content for path, content in installed.items()), 'Installer is not idempotent'
    agents = (app / 'AGENTS.md').read_text()
    assert 'bundle show fieldwork' in agents and 'vendor/fieldwork' not in agents, 'Agent reference is not portable'
    assert 'Keep application instructions.' in agents, 'Installer overwrote application instructions'
    # Only enough application code to render the installed layout and helper.
    # Task composition and form workflows are reviewed in the maintained examples.
    (app / 'app/controllers/installation_controller.rb').write_text('''class InstallationController < ApplicationController
  def show
    render inline: '<h1>Fieldwork installation</h1><button class="button" type="button" aria-label="Upload sample"><%= fieldwork_icon "upload" %></button><%= fieldwork_icon "accessibility", label: "Spreadsheet <CSV>", class: "installed-file-icon" %><span class="icon" data-icon="alarm-clock" aria-hidden="true"></span><%= fieldwork_form_with url: "/", baseline: {}, actions_position: params[:form_position] == "start" ? :start : :end do |form| %><%= fieldwork_field form, :name %><% end %>', layout: "application"
  end
end
''')
    (app / 'config/routes.rb').write_text('Rails.application.routes.draw { root "installation#show" }\n')
    # The production check runs over local HTTP. This belongs to the temporary
    # application, not the installer or library integration.
    production = app / 'config/environments/production.rb'
    production.write_text(production.read_text().replace('config.assume_ssl = true',
        'config.assume_ssl = false').replace('config.force_ssl = true', 'config.force_ssl = false'))
    return app / 'bin/rails'
