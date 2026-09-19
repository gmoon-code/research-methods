import {
  DurableObject
} from "cloudflare:workers";

import {
  createContentReleaseCoordinatorHandler
} from "./content-durable-object-handler.mjs";

class ContentReleaseCoordinator extends DurableObject {
  constructor(
    ctx,
    env
  ) {
    super(
      ctx,
      env
    );

    this.handler =
      createContentReleaseCoordinatorHandler(
        ctx.storage
      );
  }

  async fetch(request) {
    return this.handler.fetch(
      request
    );
  }
}

export {
  ContentReleaseCoordinator
};
