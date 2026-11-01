/** A separate lane per operation prevents stale requests from mutating a new record. */
export class RequestLane {
  private controller: AbortController | null = null;
  start() { this.cancel(); const controller = new AbortController(); this.controller = controller; return controller; }
  current(controller: AbortController) { return this.controller === controller && !controller.signal.aborted; }
  finish(controller: AbortController) { if (this.controller === controller) this.controller = null; }
  cancel() { this.controller?.abort(); this.controller = null; }
}
