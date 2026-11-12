import { createContext } from 'react';

// Keep nested popups inside the dialog's focus and pointer-event boundary.
export const OverlayContainerContext = createContext<HTMLElement | null>(null);
