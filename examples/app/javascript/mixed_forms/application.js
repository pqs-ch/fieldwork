import '@hotwired/turbo-rails';
import { installTurboEditing } from 'fieldwork/turbo';
import { mountMixedReview } from 'mixed_forms/mixed-review';
installTurboEditing();
mountMixedReview();
