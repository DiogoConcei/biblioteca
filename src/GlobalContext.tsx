import { createContext, ReactNode, useContext, useState } from "react";
import { GlobalContext } from "../src/types/components.interfaces";

const GlobalContext = createContext<GlobalContext>(undefined);

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [isHidden, setIsHidden] = useState(false);
  const [theme, setTheme] = useState<boolean>(false);

  return (
    <GlobalContext.Provider value={{ isHidden, setIsHidden, theme, setTheme }}>
      {children}
    </GlobalContext.Provider>
  );
}

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobal deve ser usado dentro do GlobalProvider");
  }
  return context;
};
