// Simple in-memory prefetch cache to bridge route transitions without blank states

type AnyObject = Record<string, any>;

interface PrefetchCacheShape {
  feedbackById: Map<string, AnyObject>;
  dashboardFeedback: AnyObject[] | null;
}

const cache: PrefetchCacheShape = {
  feedbackById: new Map<string, AnyObject>(),
  dashboardFeedback: null,
};

export function setPrefetchedFeedback(feedbackId: string, data: AnyObject) {
  cache.feedbackById.set(feedbackId, data);
}

export function getPrefetchedFeedback(feedbackId: string): AnyObject | undefined {
  return cache.feedbackById.get(feedbackId);
}

export function clearPrefetchedFeedback(feedbackId: string) {
  cache.feedbackById.delete(feedbackId);
}

export function setPrefetchedDashboard(feedbackList: AnyObject[]) {
  cache.dashboardFeedback = feedbackList;
}

export function getPrefetchedDashboard(): AnyObject[] | null {
  return cache.dashboardFeedback;
}

export function clearPrefetchCache() {
  cache.feedbackById.clear();
  cache.dashboardFeedback = null;
}


