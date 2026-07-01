import * as repo from './repository';
import { useSession } from './session';
import { createConsoleStore } from './storeFactory';
import { createInitialServerState } from './storeServerState';

export const useStore = createConsoleStore({
  repository: repo,
  getCurrentUser: () => useSession.getState().user,
  now: () => new Date().toISOString(),
});

// Auto-fetch on login, clear server state on logout. The subscription is module
// scoped so it fires once for the app lifetime.
useSession.subscribe((state, prev) => {
  const justLoggedIn = state.user && !prev.user;
  const justLoggedOut = !state.user && prev.user;

  if (justLoggedIn) {
    void useStore.getState().refreshEvents();
    void useStore.getState().refreshBaseline();
    void useStore.getState().refreshFeedbackResponses();
    void useStore.getState().refreshRequestUpdates();
  } else if (justLoggedOut) {
    useStore.setState(createInitialServerState());
  }
});
