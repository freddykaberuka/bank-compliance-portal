import { ApplicationState } from '../generated/prisma/enums';

// Application workflow state definitions and valid transitions

export type StateTransition = {
  [key in ApplicationState]?: ApplicationState[];
};


export const VALID_TRANSITIONS: StateTransition = {
  [ApplicationState.DRAFT]: [
    ApplicationState.SUBMITTED,
  ],
  [ApplicationState.SUBMITTED]: [
    ApplicationState.UNDER_REVIEW,
    ApplicationState.NEEDS_MORE_INFO,
  ],
  [ApplicationState.UNDER_REVIEW]: [
    ApplicationState.REVIEWED,
    ApplicationState.NEEDS_MORE_INFO,
  ],
  [ApplicationState.NEEDS_MORE_INFO]: [
    ApplicationState.SUBMITTED,
  ],
  [ApplicationState.REVIEWED]: [
    ApplicationState.APPROVED,
    ApplicationState.REJECTED,
  ],
  [ApplicationState.APPROVED]: [],
  [ApplicationState.REJECTED]: [],
};

export const TERMINAL_STATES: ApplicationState[] = [
  ApplicationState.APPROVED,
  ApplicationState.REJECTED,
];

export const canTransition = (
  currentState: ApplicationState,
  nextState: ApplicationState
): boolean => {
  if (!VALID_TRANSITIONS[currentState]) {
    return false;
  }

  // Check if next state is in the list of valid transitions
  const allowedTransitions = VALID_TRANSITIONS[currentState] || [];
  return allowedTransitions.includes(nextState);
};

export const isTerminalState = (state: ApplicationState): boolean => {
  return TERMINAL_STATES.includes(state);
};

// Get all allowed next states for a given state
export const getNextStates = (currentState: ApplicationState): ApplicationState[] => {
  return VALID_TRANSITIONS[currentState] || [];
};
