import {
  Dispatch,
  ReactNode,
  createContext,
  useContext,
  useReducer,
} from "react";

type State = {
  activeLens: string | null;
  activeCategory: string | null;
  selectedCategories: {
    [lens: string]: string;
  };
};

type Action =
  | { type: "SET_ACTIVE_LENS"; payload: string | null }
  | { type: "SET_ACTIVE_LENS_CATEGORY"; payload: string | null }
  | {
      type: "SET_SELECTED_CATEGORY_FOR_LENS";
      payload: {
        lens: string;
        category: string;
      };
    };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ACTIVE_LENS":
      return { ...state, activeLens: action.payload };
    case "SET_ACTIVE_LENS_CATEGORY":
      return { ...state, activeCategory: action.payload };
    case "SET_SELECTED_CATEGORY_FOR_LENS":
      return {
        ...state,
        selectedCategories: {
          ...state.selectedCategories,
          [action.payload.lens]: action.payload.category,
        },
      };
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
    activeLens: null,
    activeCategory: null,
    selectedCategories: {},
  });

  return (
    <LensContext.Provider value={state}>
      <LensDispatchContext.Provider value={dispatch}>
        {children}
      </LensDispatchContext.Provider>
    </LensContext.Provider>
  );
}
