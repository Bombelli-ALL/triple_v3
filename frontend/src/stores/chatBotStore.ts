import { create } from 'zustand'

export const useChatBotStore = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
	open: false,
	setOpen: (open: boolean) => set({ open }),
}))
