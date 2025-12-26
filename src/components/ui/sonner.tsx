import { Toaster as Sonner } from "sonner"

// ============================================
// TOASTER - Enhanced with gradient
// ============================================
type SonnerProps = React.ComponentProps<typeof Sonner>;

type ToasterProps = SonnerProps & {
  icons?: {
    error?: React.ReactNode;
    success?: React.ReactNode;
  };
};

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-gradient-to-br group-[.toast]:from-[hsl(200,95%,58%)] group-[.toast]:to-[hsl(210,90%,52%)] group-[.toast]:text-white',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };