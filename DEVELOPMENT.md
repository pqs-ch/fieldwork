# Developing Fieldwork

[Development policies](AGENTS.md) · [Project feedback](library/feedback.md)

## Workflow review

Use the [maintained examples](examples/README.md) to review library changes in complete desktop workflows. Follow each example's in-app review guide for its walkthrough, concrete cases and expected results. Keep reusable demonstrations in `examples/` and application behavior outside `library/`.

The examples consume the local library gem, so library changes are immediately available in the review app. Restart Rails after helper/configuration changes.

## Verification

Run commands from the repository root. Reference checks require Python 3.9+ only. Rails/browser checks also require the Ruby/Bundler environment declared in `examples/Gemfile` and `examples/Gemfile.lock`, installed example dependencies, Node/npx and Chrome.

| Change | Verification |
| --- | --- |
| Reference or examples | `python3 tests/check-links.py` |
| Reference checker | `python3 -m unittest discover -s tests -p 'test_*.py'` |
| Repository installation, installer or asset loading | `python3 tests/check-installation.py` |
| Interaction behavior | [Workflow review](#workflow-review) and the relevant [focused example checks](#examples) |

Follow the [product priorities](library/index.md#product-priorities). For interaction changes, review affected workflows in the examples app at desktop working widths. Prioritize completing the actual task, discovering available actions, understanding state and results, keyboard/focus behavior, validation, draft retention, recovery, Turbo transitions, and native fallback.

Narrow-screen, touch-specific and dedicated assistive-technology checks are optional unless the project explicitly needs them or the change directly targets that behavior. Reuse existing semantic markup and layout behavior. Run focused checks for the changed behavior; do not add a separate review matrix for every presentation variation.

The reference checker treats each fenced HTML example independently. Include referenced IDs in the same example; mark composition-only fragments with `<!-- fieldwork:fragment -->` immediately before the fence.

## Examples

The [examples catalogue](examples/README.md) lists maintained Rails demonstrations, scenario prerequisites, review scope and focused verification commands. Run the single review app with `cd examples && bin/setup` and open <http://127.0.0.1:8100>. The shared catalogue provides review guides and confirmed resets; the in-app guides own walkthroughs and concrete review cases, while `examples/README.md` owns setup, checks and implementation limits. Run `python3 tests/check-examples.py` for catalogue, isolation, reset and native-navigation boundaries.

## Releases

Consuming projects pin a Fieldwork revision with a Git submodule. Version tags identify revisions for installation and upgrades.

1. Update `spec.version` in `library/fieldwork.gemspec`. Before 1.0, use patch versions for compatible changes and minor versions when application migration is required. Update the tag in the installation example in `library/rails.md`.
2. Run `bundle install` in `examples/` to update its local-gem lockfile. Run `python3 tests/check-links.py` and `python3 tests/check-installation.py`, plus the relevant interaction checks/review.
3. Commit and push the reviewed changes, then create and push a matching `v<version>` tag.
