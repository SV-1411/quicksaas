'use client';

import * as Toast from '@radix-ui/react-toast';
import { createContext, useContext, useState } from 'react';

const ToastContext = createContext<{ show: (title: string, description?: string) => void }>({ show: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const show = (nextTitle: string, nextDescription = '') => {
    setTitle(nextTitle);
    setDescription(nextDescription);
    setOpen(true);
  };

  return (
    <ToastContext.Provider value={{ show }}>
      <Toast.Provider swipeDirection="right">
        {children}
        <Toast.Root open={open} onOpenChange={setOpen} className="fixed bottom-6 right-6 z-50 rounded-lg border bg-card p-4 shadow-xl">
          <Toast.Title className="text-sm font-semibold">{title}</Toast.Title>
          {description ? <Toast.Description className="text-xs text-muted-foreground">{description}</Toast.Description> : null}
        </Toast.Root>
        <Toast.Viewport />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
