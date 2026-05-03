import { posthog } from './posthog';

/**
 * Browser-side telemetry wrapper around posthog-js. Mirrors the
 * `TelemetryService` shape from rivet core (`src/services/TelemetryService.ts`):
 * a single private `track()` is the one place that calls `posthog.capture`,
 * and all callers go through typed, named methods so call sites stay readable
 * and event payloads stay consistent.
 *
 * Auto-enrichment (source, rivet_version equivalent) lives in `initPostHog()`
 * via `posthog.register({ source: 'landing' })` so we don't repeat it here.
 *
 * PII rule: typed methods take only the fields they need. Free-text user
 * input (e.g. comment instructions) is never captured — only its length.
 */
class Telemetry {
  private track(
    event: string,
    properties: Record<string, unknown> = {},
  ): void {
    try {
      posthog.capture(event, properties);
    } catch (err) {
      // Swallow — telemetry must never break the UI.
      // eslint-disable-next-line no-console
      console.warn(`telemetry: failed to send "${event}"`, err);
    }
  }

  // ----- Comments demo -----

  /**
   * A draft popover was opened. `source` distinguishes the auto-opened
   * seeded draft from user-initiated drafts (click on a point, or drag a
   * rectangle).
   */
  trackCommentDemoDraftCreated(props: {
    source: 'initial' | 'click' | 'drag';
    hasDragBox: boolean;
  }): void {
    this.track('comment_demo_draft_created', {
      source: props.source,
      has_drag_box: props.hasDragBox,
    });
  }

  /**
   * User submitted a new comment via the drag-rect → popover flow, or the
   * initial seeded draft. Captures only the instruction length (not text).
   */
  trackCommentDemoCommentCreated(props: {
    commentId: string;
    instructionLength: number;
    hasDragBox: boolean;
  }): void {
    this.track('comment_demo_comment_created', {
      comment_id: props.commentId,
      instruction_length: props.instructionLength,
      has_drag_box: props.hasDragBox,
    });
  }

  /** User edited an existing comment's instruction. */
  trackCommentDemoCommentEdited(props: {
    commentId: string;
    instructionLength: number;
  }): void {
    this.track('comment_demo_comment_edited', {
      comment_id: props.commentId,
      instruction_length: props.instructionLength,
    });
  }

  /** User deleted an existing comment. */
  trackCommentDemoCommentDeleted(props: { commentId: string }): void {
    this.track('comment_demo_comment_deleted', {
      comment_id: props.commentId,
    });
  }

  // ----- Variants demo -----

  /** Variants demo entered the loading phase (first visible to the user). */
  trackVariantsDemoLoadingStarted(props: { variantCount: number }): void {
    this.track('variants_demo_loading_started', {
      variant_count: props.variantCount,
    });
  }

  /** Loading finished; variants are now interactable. */
  trackVariantsDemoReady(props: { variantCount: number }): void {
    this.track('variants_demo_ready', {
      variant_count: props.variantCount,
    });
  }

  /** User clicked the previous or next pill chevron. */
  trackVariantsDemoPillNavigation(props: {
    direction: 'prev' | 'next';
    fromIndex: number;
    fromVariantId: string;
  }): void {
    this.track(`variants_demo_pill_${props.direction}_clicked`, {
      from_index: props.fromIndex,
      from_variant_id: props.fromVariantId,
    });
  }

  /** User clicked the apply control on the active variant. */
  trackVariantsDemoApplyClicked(props: {
    variantIndex: number;
    variantId: string;
  }): void {
    this.track('variants_demo_apply_clicked', {
      variant_index: props.variantIndex,
      variant_id: props.variantId,
    });
  }
}

export const telemetry = new Telemetry();
