import {
  Dispatch,
  ReactNode,
  createContext,
  useContext,
  useReducer,
} from "react";

type State = {
  currentLens: string | null;
  selectedCategory: string | null;
};

type Action =
  | { type: "SET_LENS"; payload: string | null }
  | { type: "SET_CATEGORY"; payload: string | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LENS":
      return { ...state, currentLens: action.payload };
    case "SET_CATEGORY":
      return { ...state, selectedCategory: action.payload };
    default:
      return state;
  }
}

const LensContext = createContext<State | undefined>(undefined);
const LensDispatchContext = createContext<Dispatch<Action> | undefined>(
  undefined
);

export function useLensState() {
  const context = useContext(LensContext);
  if (context === undefined) {
    throw new Error("useLensState must be used within a LensProvider");
  }
  return context;
}

export function useLensDispatch() {
  const context = useContext(LensDispatchContext);
  if (context === undefined) {
    throw new Error("useLensDispatch must be used within a LensProvider");
  }
  return context;
}

export function LensProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    currentLens: "Continuous 1",
    selectedCategory: null,
  });

  return (
    <LensContext.Provider value={state}>
      <LensDispatchContext.Provider value={dispatch}>
        {children}
      </LensDispatchContext.Provider>
    </LensContext.Provider>
  );
}
